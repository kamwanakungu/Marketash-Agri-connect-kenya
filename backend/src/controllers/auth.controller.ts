import 'dotenv/config';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Profile from '../models/Profile';
import smsService from '../services/sms.service';
import { cache } from '../config/redis';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../middleware/auth';
import logger from '../utils/logger';

type AnyReq = Request & { user?: any; token?: string };

export const initiateRegistration = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    const existingUser = await User.findOne({ phone });

    if (existingUser && existingUser.isPhoneVerified) {
      return res.status(400).json({ success: false, message: 'Phone number already registered' });
    }

    const otp = smsService.generateOTP();

    await (cache as any).set(`otp:register:${phone}`, otp, 600);

    const attempts = Number(await (cache as any).get(`otp:attempts:${phone}`)) || 0;
    if (attempts >= 5) {
      return res.status(429).json({ success: false, message: 'Too many OTP requests. Please try again in 1 hour.' });
    }
    await (cache as any).set(`otp:attempts:${phone}`, attempts + 1, 3600);

    const smsResult = await smsService.sendOTP(phone, otp);
    if (!smsResult.success) {
      logger.error('Failed to send OTP:', smsResult);
      return res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
    }

    const response: any = { success: true, message: 'OTP sent successfully', expiresIn: 600 };
    if (process.env.NODE_ENV === 'development') response.otp = otp;

    logger.info('Registration OTP sent', { phone });
    return res.status(200).json(response);
  } catch (error: any) {
    logger.error('Registration initiation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const completeRegistration = async (req: Request, res: Response) => {
  try {
    const {
      phone,
      otp,
      email,
      fullNames,
      nationalId,
      role,
      location,
      address,
      farmName,
      businessName,
      vehicleType
    } = req.body as any;

    const storedOTP = await (cache as any).get(`otp:register:${phone}`);
    if (!storedOTP || storedOTP !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const existingUser = await User.findOne({ $or: [{ phone }, { email }] });
    if (existingUser && existingUser.isPhoneVerified) {
      return res.status(400).json({ success: false, message: 'User already registered' });
    }

    const existingNationalId = await User.findByNationalId(nationalId);
    if (existingNationalId) {
      return res.status(400).json({ success: false, message: 'National ID already registered' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const createdUsers: any = await User.create([{
        phone,
        email,
        nationalIdEncrypted: nationalId,
        role,
        isPhoneVerified: true,
        status: 'pending_verification',
        kycStatus: 'pending'
      }], { session });

      const user = createdUsers[0];

      const createdProfiles: any = await Profile.create([{
        userId: user._id,
        fullNames,
        location: {
          type: 'Point',
          coordinates: location?.coordinates || []
        },
        address: address || {},
        ...(role === 'farmer' && { farmName }),
        ...(role === 'buyer' && { businessName }),
        ...(role === 'driver' && { vehicleType })
      }], { session });

      await session.commitTransaction();

      await (cache as any).del(`otp:register:${phone}`);
      await (cache as any).del(`otp:attempts:${phone}`);

      const accessToken = generateAccessToken(user._id.toString(), user.role);
      const refreshToken = generateRefreshToken(user._id.toString());

      const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
      user.refreshTokens = user.refreshTokens || [];
      user.refreshTokens.push(hashedRefreshToken);
      await user.save();

      logger.info('User registered successfully', { userId: user._id, role: user.role });

      return res.status(201).json({
        success: true,
        message: 'Registration completed successfully',
        data: {
          user: {
            id: user._id,
            phone: user.phone,
            email: user.email,
            role: user.role,
            kycStatus: user.kycStatus,
            status: user.status
          },
          profile: {
            id: createdProfiles[0]._id,
            fullNames: createdProfiles[0].fullNames,
            location: createdProfiles[0].location
          },
          tokens: { accessToken, refreshToken }
        }
      });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } catch (error: any) {
    logger.error('Registration completion error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const initiateLogin = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const otp = smsService.generateOTP();
    await (cache as any).set(`otp:login:${phone}`, otp, 600);

    const attempts = Number(await (cache as any).get(`otp:attempts:${phone}`)) || 0;
    if (attempts >= 5) return res.status(429).json({ success: false, message: 'Too many login attempts. Please try again later.' });
    await (cache as any).set(`otp:attempts:${phone}`, attempts + 1, 3600);

    const smsResult = await smsService.sendOTP(phone, otp);
    if (!smsResult.success) return res.status(500).json({ success: false, message: 'Failed to send OTP' });

    const response: any = { success: true, message: 'OTP sent successfully', expiresIn: 600 };
    if (process.env.NODE_ENV === 'development') response.otp = otp;

    logger.info('Login OTP sent', { phone });
    return res.status(200).json(response);
  } catch (error: any) {
    logger.error('Login initiation error:', error);
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
};

export const verifyLogin = async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;
    const storedOTP = await (cache as any).get(`otp:login:${phone}`);
    if (!storedOTP || storedOTP !== otp) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    const user: any = await User.findOne({ phone }).populate('profile');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.lastLogin = new Date();
    await user.save();

    await (cache as any).del(`otp:login:${phone}`);
    await (cache as any).del(`otp:attempts:${phone}`);

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(hashedRefreshToken);
    if (user.refreshTokens.length > 5) user.refreshTokens = user.refreshTokens.slice(-5);
    await user.save();

    logger.info('User logged in', { userId: user._id });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          phone: user.phone,
          email: user.email,
          role: user.role,
          kycStatus: user.kycStatus,
          status: user.status,
          canTransact: user.canTransact(),
          isPhoneVerified: user.isPhoneVerified,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin
        },
        profile: user.profile ? {
          fullNames: user.profile.fullNames,
          location: user.profile.location,
          farmName: user.profile.farmName,
          businessName: user.profile.businessName
        } : null,
        tokens: { accessToken, refreshToken }
      }
    });
  } catch (error: any) {
    logger.error('Login verification error:', error);
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body as any;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token required' });

    const decoded: any = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET as string);
    if (!decoded) return res.status(401).json({ success: false, message: 'Invalid refresh token' });

    const user: any = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const tokenExists = await Promise.all(user.refreshTokens.map((token: string) => bcrypt.compare(refreshToken, token)));
    if (!tokenExists.includes(true)) return res.status(401).json({ success: false, message: 'Invalid refresh token' });

    const newAccessToken = generateAccessToken(user._id.toString(), user.role);
    return res.status(200).json({ success: true, data: { accessToken: newAccessToken } });
  } catch (error: any) {
    logger.error('Token refresh error:', error);
    return res.status(500).json({ success: false, message: 'Token refresh failed' });
  }
};

export const logout = async (req: AnyReq, res: Response) => {
  try {
    const { refreshToken } = req.body as any;
    const accessToken = req.token;

    if (accessToken) {
      await (cache as any).set(`blacklist:${accessToken}`, 'true', 900);
    }

    if (refreshToken && req.user) {
      const user: any = await User.findById(req.user._id);
      const updatedTokens: string[] = [];
      for (const token of user.refreshTokens || []) {
        const matches = await bcrypt.compare(refreshToken, token);
        if (!matches) updatedTokens.push(token);
      }
      user.refreshTokens = updatedTokens;
      await user.save();
    }

    logger.info('User logged out', { userId: req.user?._id });
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    logger.error('Logout error:', error);
    return res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

export const getCurrentUser = async (req: AnyReq, res: Response) => {
  try {
    const user: any = await User.findById(req.user._id).populate('profile');
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          phone: user.phone,
          email: user.email,
          role: user.role,
          kycStatus: user.kycStatus,
          status: user.status,
          canTransact: user.canTransact(),
          isPhoneVerified: user.isPhoneVerified,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin
        },
        profile: user.profile
      }
    });
  } catch (error: any) {
    logger.error('Get current user error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get user data' });
  }
};

export default {
  initiateRegistration,
  completeRegistration,
  initiateLogin,
  verifyLogin,
  refreshToken,
  logout,
  getCurrentUser
};
```// filepath: /workspaces/Marketash-Agri-connect-kenya/agriconnect-kenya/backend/src/controllers/auth.controller.ts
import 'dotenv/config';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Profile from '../models/Profile';
import smsService from '../services/sms.service';
import { cache } from '../config/redis';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../middleware/auth';
import logger from '../utils/logger';

type AnyReq = Request & { user?: any; token?: string };

export const initiateRegistration = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    const existingUser = await User.findOne({ phone });

    if (existingUser && existingUser.isPhoneVerified) {
      return res.status(400).json({ success: false, message: 'Phone number already registered' });
    }

    const otp = smsService.generateOTP();

    await (cache as any).set(`otp:register:${phone}`, otp, 600);

    const attempts = Number(await (cache as any).get(`otp:attempts:${phone}`)) || 0;
    if (attempts >= 5) {
      return res.status(429).json({ success: false, message: 'Too many OTP requests. Please try again in 1 hour.' });
    }
    await (cache as any).set(`otp:attempts:${phone}`, attempts + 1, 3600);

    const smsResult = await smsService.sendOTP(phone, otp);
    if (!smsResult.success) {
      logger.error('Failed to send OTP:', smsResult);
      return res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
    }

    const response: any = { success: true, message: 'OTP sent successfully', expiresIn: 600 };
    if (process.env.NODE_ENV === 'development') response.otp = otp;

    logger.info('Registration OTP sent', { phone });
    return res.status(200).json(response);
  } catch (error: any) {
    logger.error('Registration initiation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const completeRegistration = async (req: Request, res: Response) => {
  try {
    const {
      phone,
      otp,
      email,
      fullNames,
      nationalId,
      role,
      location,
      address,
      farmName,
      businessName,
      vehicleType
    } = req.body as any;

    const storedOTP = await (cache as any).get(`otp:register:${phone}`);
    if (!storedOTP || storedOTP !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const existingUser = await User.findOne({ $or: [{ phone }, { email }] });
    if (existingUser && existingUser.isPhoneVerified) {
      return res.status(400).json({ success: false, message: 'User already registered' });
    }

    const existingNationalId = await User.findByNationalId(nationalId);
    if (existingNationalId) {
      return res.status(400).json({ success: false, message: 'National ID already registered' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const createdUsers: any = await User.create([{
        phone,
        email,
        nationalIdEncrypted: nationalId,
        role,
        isPhoneVerified: true,
        status: 'pending_verification',
        kycStatus: 'pending'
      }], { session });

      const user = createdUsers[0];

      const createdProfiles: any = await Profile.create([{
        userId: user._id,
        fullNames,
        location: {
          type: 'Point',
          coordinates: location?.coordinates || []
        },
        address: address || {},
        ...(role === 'farmer' && { farmName }),
        ...(role === 'buyer' && { businessName }),
        ...(role === 'driver' && { vehicleType })
      }], { session });

      await session.commitTransaction();

      await (cache as any).del(`otp:register:${phone}`);
      await (cache as any).del(`otp:attempts:${phone}`);

      const accessToken = generateAccessToken(user._id.toString(), user.role);
      const refreshToken = generateRefreshToken(user._id.toString());

      const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
      user.refreshTokens = user.refreshTokens || [];
      user.refreshTokens.push(hashedRefreshToken);
      await user.save();

      logger.info('User registered successfully', { userId: user._id, role: user.role });

      return res.status(201).json({
        success: true,
        message: 'Registration completed successfully',
        data: {
          user: {
            id: user._id,
            phone: user.phone,
            email: user.email,
            role: user.role,
            kycStatus: user.kycStatus,
            status: user.status
          },
          profile: {
            id: createdProfiles[0]._id,
            fullNames: createdProfiles[0].fullNames,
            location: createdProfiles[0].location
          },
          tokens: { accessToken, refreshToken }
        }
      });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } catch (error: any) {
    logger.error('Registration completion error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const initiateLogin = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const otp = smsService.generateOTP();
    await (cache as any).set(`otp:login:${phone}`, otp, 600);

    const attempts = Number(await (cache as any).get(`otp:attempts:${phone}`)) || 0;
    if (attempts >= 5) return res.status(429).json({ success: false, message: 'Too many login attempts. Please try again later.' });
    await (cache as any).set(`otp:attempts:${phone}`, attempts + 1, 3600);

    const smsResult = await smsService.sendOTP(phone, otp);
    if (!smsResult.success) return res.status(500).json({ success: false, message: 'Failed to send OTP' });

    const response: any = { success: true, message: 'OTP sent successfully', expiresIn: 600 };
    if (process.env.NODE_ENV === 'development') response.otp = otp;

    logger.info('Login OTP sent', { phone });
    return res.status(200).json(response);
  } catch (error: any) {
    logger.error('Login initiation error:', error);
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
};

export const verifyLogin = async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;
    const storedOTP = await (cache as any).get(`otp:login:${phone}`);
    if (!storedOTP || storedOTP !== otp) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    const user: any = await User.findOne({ phone }).populate('profile');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.lastLogin = new Date();
    await user.save();

    await (cache as any).del(`otp:login:${phone}`);
    await (cache as any).del(`otp:attempts:${phone}`);

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(hashedRefreshToken);
    if (user.refreshTokens.length > 5) user.refreshTokens = user.refreshTokens.slice(-5);
    await user.save();

    logger.info('User logged in', { userId: user._id });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          phone: user.phone,
          email: user.email,
          role: user.role,
          kycStatus: user.kycStatus,
          status: user.status,
          canTransact: user.canTransact(),
          isPhoneVerified: user.isPhoneVerified,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin
        },
        profile: user.profile ? {
          fullNames: user.profile.fullNames,
          location: user.profile.location,
          farmName: user.profile.farmName,
          businessName: user.profile.businessName
        } : null,
        tokens: { accessToken, refreshToken }
      }
    });
  } catch (error: any) {
    logger.error('Login verification error:', error);
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body as any;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token required' });

    const decoded: any = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET as string);
    if (!decoded) return res.status(401).json({ success: false, message: 'Invalid refresh token' });

    const user: any = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const tokenExists = await Promise.all(user.refreshTokens.map((token: string) => bcrypt.compare(refreshToken, token)));
    if (!tokenExists.includes(true)) return res.status(401).json({ success: false, message: 'Invalid refresh token' });

    const newAccessToken = generateAccessToken(user._id.toString(), user.role);
    return res.status(200).json({ success: true, data: { accessToken: newAccessToken } });
  } catch (error: any) {
    logger.error('Token refresh error:', error);
    return res.status(500).json({ success: false, message: 'Token refresh failed' });
  }
};

export const logout = async (req: AnyReq, res: Response) => {
  try {
    const { refreshToken } = req.body as any;
    const accessToken = req.token;

    if (accessToken) {
      await (cache as any).set(`blacklist:${accessToken}`, 'true', 900);
    }

    if (refreshToken && req.user) {
      const user: any = await User.findById(req.user._id);
      const updatedTokens: string[] = [];
      for (const token of user.refreshTokens || []) {
        const matches = await bcrypt.compare(refreshToken, token);
        if (!matches) updatedTokens.push(token);
      }
      user.refreshTokens = updatedTokens;
      await user.save();
    }

    logger.info('User logged out', { userId: req.user?._id });
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    logger.error('Logout error:', error);
    return res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

export const getCurrentUser = async (req: AnyReq, res: Response) => {
  try {
    const user: any = await User.findById(req.user._id).populate('profile');
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          phone: user.phone,
          email: user.email,
          role: user.role,
          kycStatus: user.kycStatus,
          status: user.status,
          canTransact: user.canTransact(),
          isPhoneVerified: user.isPhoneVerified,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin
        },
        profile: user.profile
      }
    });
  } catch (error: any) {
    logger.error('Get current user error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get user data' });
  }
};

export default {
  initiateRegistration,
  completeRegistration,
  initiateLogin,
  verifyLogin,
  refreshToken,
  logout,
  getCurrentUser
};