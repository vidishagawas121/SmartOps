import { Response } from 'express';
import User from '../models/User';
import Company from '../models/Company';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * PUT /api/users/profile
 * Updates the authenticated user's profile details (fullName, email, mobileNumber, companyName, licenseNumber, vehicleNumber, avatarUrl).
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { fullName, email, mobileNumber, companyName, licenseNumber, vehicleNumber, avatarUrl } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Missing user ID.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Check email uniqueness if it is being changed
    if (email && String(email).trim().toLowerCase() !== user.email.toLowerCase()) {
      const cleanEmail = String(email).trim().toLowerCase();
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser && String(existingUser._id) !== String(user._id)) {
        return res.status(400).json({ success: false, message: 'Email address is already in use by another account.' });
      }
      user.email = cleanEmail;
    }

    // Update fields
    if (fullName && String(fullName).trim() !== '') {
      user.fullName = String(fullName).trim();
    }
    if (mobileNumber !== undefined) {
      user.mobileNumber = String(mobileNumber).trim();
    }
    if (companyName && user.role === 'Owner') {
      const cleanCompanyName = String(companyName).trim();
      user.companyName = cleanCompanyName;
      if (user.companyId) {
        try {
          await Company.findOneAndUpdate(
            { companyId: user.companyId },
            { companyName: cleanCompanyName }
          );
        } catch (cErr: any) {
          console.warn('[User Profile] Company update sync warning:', cErr.message);
        }
      }
    }
    if (licenseNumber !== undefined) {
      user.licenseNumber = String(licenseNumber).trim();
    }
    if (vehicleNumber !== undefined) {
      user.vehicleNumber = String(vehicleNumber).trim();
    }
    if (avatarUrl !== undefined) {
      user.avatarUrl = avatarUrl;
    }

    await user.save();

    // Sanitized user object to return to client
    const userDTO = {
      id: String(user._id),
      fullName: user.fullName,
      email: user.email,
      mobileNumber: user.mobileNumber || '',
      role: user.role,
      companyId: user.companyId || null,
      companyName: user.companyName || null,
      driverId: user.driverId || null,
      vehicleNumber: user.vehicleNumber || null,
      licenseNumber: user.licenseNumber || null,
      avatarUrl: user.avatarUrl || null,
      isEmailVerified: Boolean(user.isEmailVerified),
      isPhoneVerified: Boolean(user.isPhoneVerified)
    };

    res.json({
      success: true,
      message: 'Profile attributes saved successfully.',
      user: userDTO
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

/**
 * GET /api/users/profile
 * Returns the authenticated user's profile details from DB.
 */
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Missing user ID.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const userDTO = {
      id: String(user._id),
      fullName: user.fullName,
      email: user.email,
      mobileNumber: user.mobileNumber || '',
      role: user.role,
      companyId: user.companyId || null,
      companyName: user.companyName || null,
      driverId: user.driverId || null,
      vehicleNumber: user.vehicleNumber || null,
      licenseNumber: user.licenseNumber || null,
      avatarUrl: user.avatarUrl || null,
      isEmailVerified: Boolean(user.isEmailVerified),
      isPhoneVerified: Boolean(user.isPhoneVerified)
    };

    res.json({
      success: true,
      user: userDTO
    });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

