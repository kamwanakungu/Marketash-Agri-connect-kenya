import { Request, Response } from 'express';
import User from '../models/User';
import Profile from '../models/Profile';

// Get user profile
export const getUserProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id; // Assuming user ID is stored in req.user
        const user = await User.findById(userId).populate('profile');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update user profile
export const updateUserProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id; // Assuming user ID is stored in req.user
        const { name, location } = req.body;

        const updatedProfile = await Profile.findOneAndUpdate(
            { userId },
            { name, location },
            { new: true, upsert: true }
        );

        res.status(200).json(updatedProfile);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Upload KYC document
export const uploadKYCDocument = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id; // Assuming user ID is stored in req.user
        const kycDocument = req.file; // Assuming file is uploaded using multer

        if (!kycDocument) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Save KYC document logic here (e.g., save to S3 and update user model)

        res.status(200).json({ message: 'KYC document uploaded successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Check KYC status
export const checkKYCStatus = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id; // Assuming user ID is stored in req.user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ kycStatus: user.kycStatus });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};