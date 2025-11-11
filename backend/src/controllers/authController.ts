import { Request, Response } from 'express';
import User from '../models/User';
import { sendOtp, verifyOtp } from '../services/smsService';
import { generateTokens } from '../utils/helpers';
import bcrypt from 'bcryptjs';

export const registerInit = async (req: Request, res: Response) => {
    const { phone } = req.body;

    try {
        const user = await User.findOne({ phone });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await sendOtp(phone, otp);
        
        // Store OTP in Redis or database for verification
        // ...

        return res.status(200).json({ message: 'OTP sent' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error });
    }
};

export const registerVerify = async (req: Request, res: Response) => {
    const { phone, otp } = req.body;

    try {
        // Verify OTP from Redis or database
        // ...

        const newUser = new User({ phone, role: 'buyer' });
        await newUser.save();

        return res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error });
    }
};

export const loginInit = async (req: Request, res: Response) => {
    const { phone } = req.body;

    try {
        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await sendOtp(phone, otp);
        
        // Store OTP in Redis or database for verification
        // ...

        return res.status(200).json({ message: 'OTP sent' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error });
    }
};

export const loginVerify = async (req: Request, res: Response) => {
    const { phone, otp } = req.body;

    try {
        // Verify OTP from Redis or database
        // ...

        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const tokens = generateTokens(user);
        return res.status(200).json({ message: 'Login successful', tokens });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error });
    }
};

export const logout = async (req: Request, res: Response) => {
    const { userId } = req.body;

    try {
        // Invalidate tokens or remove from database
        // ...

        return res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error });
    }
};