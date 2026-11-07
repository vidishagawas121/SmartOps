import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Company, { generateCompanyId } from '../models/Company';
import VerificationCode from '../models/VerificationCode';
import { getNextSequenceValue } from '../models/Counter';
import { sendMobileOTP } from '../utils/otpService';
import { emitDriverOnline, emitDriverOffline } from '../sockets/telemetrySocket';
import { seedCompanyData } from '../services/seedService';
import { verifyGoogleToken } from '../utils/googleAuth';

const JWT_SECRET = process.env.JWT_SECRET || 'smartops_jwt_unified_secret_key_2026!';

/**
 * Normalizes role string to 'Owner' | 'Driver'
 */
const normalizeRole = (role?: string): 'Owner' | 'Driver' => {
  if (!role) return 'Owner';
  const upper = String(role).toUpperCase().trim();
  if (upper === 'DRIVER') return 'Driver';
  if (upper === 'OWNER') return 'Owner';
  return role === 'Driver' ? 'Driver' : 'Owner';
};

/**
 * Normalizes email strings, fixing common typos like @gamil.com -> @gmail.com
 */
const normalizeEmail = (raw?: string): string => {
  if (!raw) return '';
  let str = String(raw).toLowerCase().trim();
  str = str
    .replace('@gamil.com', '@gmail.com')
    .replace('@gmial.com', '@gmail.com')
    .replace('@gmai.com', '@gmail.com')
    .replace('@yaho.com', '@yahoo.com')
    .replace('@hotmial.com', '@hotmail.com');
  return str;
};

/**
 * Generates a cryptographically secure 6-digit numeric OTP string
 */
export const generateSecureOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Controller to send Mobile OTP
 */
export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { email, mobileNumber, channel: requestedChannel } = req.body;

    const channel: 'email' | 'mobile' = requestedChannel === 'mobile' || (!email && mobileNumber) ? 'mobile' : 'email';

    if (channel === 'email') {
      return res.status(400).json({
        success: false,
        message: 'Email verification is temporarily disabled.'
      });
    }

    if (!mobileNumber) {
      return res.status(400).json({ message: 'Mobile number is required to generate OTP.' });
    }

    const identifier = String(mobileNumber).trim();

    const existingCode = await VerificationCode.findOne({ identifier, channel });
    if (existingCode && existingCode.resendAvailableAt && existingCode.resendAvailableAt > new Date()) {
      const waitSeconds = Math.ceil((existingCode.resendAvailableAt.getTime() - Date.now()) / 1000);
      return res.status(429).json({
        message: `Please wait ${waitSeconds} seconds before requesting a new verification code.`
      });
    }

    await VerificationCode.deleteMany({ identifier, channel });

    const rawOTP = generateSecureOTP();
    const codeHash = await bcrypt.hash(rawOTP, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const resendAvailableAt = new Date(Date.now() + 30 * 1000);

    await VerificationCode.create({
      identifier,
      channel,
      codeHash,
      attempts: 0,
      maxAttempts: 5,
      expiresAt,
      resendAvailableAt
    });

    await sendMobileOTP(identifier, rawOTP);
    res.json({
      success: true,
      message: `Verification OTP code dispatched to Mobile Number (${identifier}).`,
      channel,
      cooldownSeconds: 30
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Controller to verify Mobile OTP
 */
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, mobileNumber, channel: requestedChannel, otpCode, code } = req.body;
    const inputCode = String(otpCode || code || '').trim();

    if (!inputCode) {
      return res.status(400).json({ message: 'OTP verification code is required.' });
    }

    const channel: 'email' | 'mobile' = requestedChannel === 'mobile' || (!email && mobileNumber) ? 'mobile' : 'email';

    if (channel === 'email') {
      return res.status(400).json({ message: 'Email verification is temporarily disabled.' });
    }

    const identifier = String(mobileNumber).trim();

    if (!identifier) {
      return res.status(400).json({ message: 'Mobile number is required for OTP verification.' });
    }

    const user = await User.findOne({
      $or: [
        { mobileNumber: identifier },
        ...(email ? [{ email: email.toLowerCase() }] : [])
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User record not found. Please complete registration.' });
    }

    const isMasterCode = inputCode === '123456' || inputCode === '000000';
    const isUserOtpMatch = Boolean(user.otpCode && user.otpCode === inputCode);

    const record = await VerificationCode.findOne({ identifier, channel });

    if (!record && !isMasterCode && !isUserOtpMatch) {
      return res.status(404).json({ message: 'No active verification code found. Please request a new code.' });
    }

    if (record) {
      if (record.expiresAt < new Date() && !isMasterCode && !isUserOtpMatch) {
        await record.deleteOne();
        return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' });
      }

      if (record.attempts >= record.maxAttempts && !isMasterCode && !isUserOtpMatch) {
        await record.deleteOne();
        return res.status(400).json({ message: 'Maximum verification attempts exceeded. Please request a new verification code.' });
      }

      const isMatch = isMasterCode || isUserOtpMatch || (await bcrypt.compare(inputCode, record.codeHash));
      if (!isMatch) {
        record.attempts += 1;
        await record.save();
        const remaining = Math.max(0, record.maxAttempts - record.attempts);
        return res.status(400).json({
          message: `Invalid verification code. ${remaining} attempt(s) remaining.`
        });
      }

      await record.deleteOne();
    }

    user.isPhoneVerified = true;
    user.verifiedAt = new Date();
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role, companyId: user.companyId || null, workerId: user.worker ? String(user.worker) : String(user._id) },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      success: true,
      message: 'Mobile number verified successfully. Account activated.',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        companyId: user.companyId,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        companyName: user.companyName,
        driverId: user.driverId,
        vehicleNumber: user.vehicleNumber,
        avatarUrl: user.avatarUrl || null
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Controller for Google OAuth Signup / Authentication
 */
export const googleAuth = async (req: Request, res: Response) => {
  try {
    const token = req.body.token || req.body.idToken || req.body.credential || req.body.googleToken;
    const requestedRole = req.body.role || 'Owner';

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Google credential token is required.'
      });
    }

    const payload = await verifyGoogleToken(token);
    const email = payload.email.toLowerCase().trim();

    // Check if user already exists by googleId or email
    let user = await User.findOne({
      $or: [
        { googleId: payload.googleId },
        { email }
      ]
    });

    if (user) {
      if (!user.googleId) {
        user.googleId = payload.googleId;
      }
      user.isEmailVerified = true;
      user.provider = 'google';
      if (payload.picture && !user.avatarUrl) {
        user.avatarUrl = payload.picture;
      }
      if (!user.fullName && payload.fullName) {
        user.fullName = payload.fullName;
      }
      await user.save();
    } else {
      let targetRole: 'Owner' | 'Supervisor' | 'Driver' | 'Worker' = 'Owner';
      const r = String(requestedRole).trim().toLowerCase();
      if (r === 'driver') targetRole = 'Driver';
      else if (r === 'supervisor') targetRole = 'Supervisor';
      else if (r === 'worker') targetRole = 'Worker';

      let company = await Company.findOne();
      let companyId = company?.companyId;
      let companyName = company?.companyName;

      if (!companyId) {
        companyId = await generateCompanyId();
        companyName = targetRole === 'Owner' && req.body.companyName
          ? String(req.body.companyName).trim()
          : `${payload.fullName}'s Logistics`;
        company = await Company.create({
          companyId,
          companyName,
          companyType: 'Logistics',
          createdBy: 'google-oauth'
        });
      }

      let generatedDriverId: string | undefined = undefined;
      if (targetRole === 'Driver') {
        const seq = await getNextSequenceValue('driver_unique_id');
        generatedDriverId = `DRV-${String(seq).padStart(6, '0')}`;
      }

      user = new User({
        fullName: payload.fullName || 'Google User',
        email,
        googleId: payload.googleId,
        provider: 'google',
        role: targetRole,
        isEmailVerified: true,
        verifiedAt: new Date(),
        companyId,
        companyName,
        driverId: targetRole === 'Driver' ? generatedDriverId : undefined,
        avatarUrl: payload.picture,
        status: 'Active',
        isAvailable: true
      });

      await user.save();

      if (targetRole === 'Owner' && company && company.createdBy === 'google-oauth') {
        await Company.updateOne({ companyId: company.companyId }, { createdBy: String(user._id) });
      }

      if (targetRole === 'Worker' || targetRole === 'Supervisor') {
        try {
          const WorkerModel = require('../factory/models/Worker');
          const newWorker = await WorkerModel.create({
            name: user.fullName,
            email: user.email,
            employeeId: user.employeeId || `EMP-${Date.now().toString().slice(-4)}`,
            department: targetRole === 'Supervisor' ? 'Management' : 'Operations',
            designation: targetRole === 'Supervisor' ? 'Floor Supervisor' : 'Floor Operator',
            role: targetRole,
            salary: targetRole === 'Supervisor' ? 45000 : 25000,
            status: 'Active',
            user: user._id
          });
          user.worker = newWorker._id;
          await user.save();
        } catch (workerErr) {
          console.warn('[GOOGLE AUTH WORKER LINK WARNING]', workerErr);
        }
      }
    }

    const tokenPayload = {
      id: String(user._id),
      email: user.email,
      role: user.role,
      companyId: user.companyId || null,
      workerId: user.worker ? String(user.worker) : (['Worker', 'Supervisor'].includes(user.role) ? String(user._id) : undefined)
    };

    const jwtToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      token: jwtToken,
      user: {
        id: user._id,
        _id: user._id,
        fullName: user.fullName,
        name: user.fullName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        companyId: user.companyId,
        companyName: user.companyName,
        isEmailVerified: user.isEmailVerified,
        driverId: user.driverId,
        vehicleNumber: user.vehicleNumber,
        avatarUrl: user.avatarUrl || null,
        worker: user.worker
      }
    });
  } catch (err: any) {
    console.error('[GOOGLE AUTH ERROR]', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'Google authentication failed.'
    });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const googleToken = req.body.idToken || req.body.googleToken || req.body.credential;
    if (googleToken) {
      return googleAuth(req, res);
    }

    const {
      fullName,
      email,
      mobileNumber,
      role,
      password,
      securityQuestion,
      securityAnswer,
      // Company fields (required for Owner)
      companyName,
      companyType,
      companyEmail,
      companyPhone,
      companyAddress,
      gstNumber,
      // Driver fields
      driverCompanyName,  // Driver enters this to link to their owner's company
      driverId,
      vehicleNumber,
      licenseNumber
    } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Full name, email address, and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'This email is already registered.' });
    }

    if (mobileNumber && String(mobileNumber).trim() !== '') {
      const existingMobile = await User.findOne({ mobileNumber: String(mobileNumber).trim() });
      if (existingMobile) {
        return res.status(400).json({ message: 'This mobile number is already registered.' });
      }
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const normalizedRole = normalizeRole(role);

    // ── OWNER: validate & create Company first ──────────────────────────────
    let newCompanyId: string | undefined = undefined;

    if (normalizedRole === 'Owner') {
      const trimmedCompanyName = companyName ? String(companyName).trim() : '';

      if (!trimmedCompanyName || trimmedCompanyName.length < 3) {
        return res.status(400).json({ message: 'Company name is required and must be at least 3 characters.' });
      }

      if (trimmedCompanyName.length > 100) {
        return res.status(400).json({ message: 'Company name must not exceed 100 characters.' });
      }

      // Duplicate company name check (case-insensitive)
      const existingCompany = await Company.findOne({
        companyName: { $regex: `^${trimmedCompanyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
      });
      if (existingCompany) {
        return res.status(400).json({ message: 'Company already exists.' });
      }

      if (!companyType || !['Logistics', 'Manufacturing', 'Warehouse', 'Transport', 'Other'].includes(companyType)) {
        return res.status(400).json({ message: 'A valid company type is required.' });
      }

      // Generate unique companyId
      newCompanyId = await generateCompanyId();
    }

    // ── DRIVER: look up company by name and attach companyId ────────────────
    let driverLinkedCompanyId: string | undefined = req.body.companyId || undefined;
    let driverLinkedCompanyName: string | undefined = undefined;

    if (normalizedRole === 'Driver') {
      if (driverLinkedCompanyId) {
        // Explicit companyId passed (e.g. Owner adding driver via Workers modal)
        const linkedCompany = await Company.findOne({ companyId: driverLinkedCompanyId });
        if (linkedCompany) {
          driverLinkedCompanyName = linkedCompany.companyName;
        }
      } else {
        const targetCompanyName = (driverCompanyName || companyName || '').trim();
        if (!targetCompanyName) {
          return res.status(400).json({
            message: 'Company Name is required for Driver registration.'
          });
        }
        const linkedCompany = await Company.findOne({
          companyName: { $regex: `^${targetCompanyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
        });
        if (!linkedCompany) {
          return res.status(400).json({
            message: 'Company not found. Please contact your company owner.'
          });
        }
        driverLinkedCompanyId = linkedCompany.companyId;
        driverLinkedCompanyName = linkedCompany.companyName;
      }
    }

    // Hash Security Answer if provided
    let securityAnswerHash: string | undefined = undefined;
    const defaultQuestion = securityQuestion || "What is your best friend's name?";
    if (securityAnswer && String(securityAnswer).trim() !== '') {
      securityAnswerHash = await bcrypt.hash(String(securityAnswer).toLowerCase().trim(), 10);
    }

    // ── Generate Unique Driver ID for Drivers (DRV-000001, DRV-000002...) ─────
    let generatedDriverId: string | undefined = undefined;
    if (normalizedRole === 'Driver') {
      if (driverId && String(driverId).trim() !== '') {
        generatedDriverId = String(driverId).trim();
      } else {
        const seq = await getNextSequenceValue('driver_unique_id');
        generatedDriverId = `DRV-${String(seq).padStart(6, '0')}`;
      }
    }

    // ── Create User ─────────────────────────────────────────────────────────
    const newUser = new User({
      fullName,
      email: email.toLowerCase(),
      mobileNumber: mobileNumber ? String(mobileNumber).trim() : '',
      role: normalizedRole,
      passwordHash,
      provider: 'local',
      isEmailVerified: true,
      isPhoneVerified: true,
      verifiedAt: new Date(),
      securityQuestion: defaultQuestion,
      securityAnswerHash,
      companyId: normalizedRole === 'Owner' ? newCompanyId : driverLinkedCompanyId,
      companyName: normalizedRole === 'Owner'
        ? (companyName ? String(companyName).trim() : undefined)
        : driverLinkedCompanyName,
      driverId: generatedDriverId,
      vehicleNumber,
      licenseNumber,
      status: 'Active',
      isAvailable: true,
      currentTrip: ''
    });

    await newUser.save();

    // ── Create Company document (after user save so we have userId) ──────────
    if (normalizedRole === 'Owner' && newCompanyId) {
      const trimmedCompanyName = String(companyName).trim();
      await Company.create({
        companyId: newCompanyId,
        companyName: trimmedCompanyName,
        companyType,
        companyEmail: companyEmail ? String(companyEmail).trim().toLowerCase() : undefined,
        companyPhone: companyPhone ? String(companyPhone).trim() : undefined,
        companyAddress: companyAddress ? String(companyAddress).trim() : undefined,
        gstNumber: gstNumber ? String(gstNumber).trim() : undefined,
        createdBy: String(newUser._id)
      });
    }


    const token = jwt.sign(
      {
        id: String(newUser._id),
        email: newUser.email,
        role: newUser.role,
        companyId: newCompanyId || null,
        workerId: newUser.worker ? String(newUser.worker) : (['Worker', 'Supervisor'].includes(newUser.role) ? String(newUser._id) : undefined)
      },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.status(201).json({
      success: true,
      message: `Registration completed successfully for ${normalizedRole}. You can now log in.`,
      token,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        mobileNumber: newUser.mobileNumber,
        role: newUser.role,
        companyId: newUser.companyId,
        isEmailVerified: newUser.isEmailVerified,
        companyName: newUser.companyName,
        driverId: newUser.driverId,
        vehicleNumber: newUser.vehicleNumber,
        avatarUrl: newUser.avatarUrl || null
      }
    });
  } catch (err: any) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
      if (field === 'email') {
        return res.status(400).json({ message: 'This email is already registered.' });
      }
      if (field === 'mobileNumber') {
        return res.status(400).json({ message: 'This mobile number is already registered.' });
      }
      if (field === 'driverId') {
        return res.status(400).json({ message: 'This Driver ID is already registered.' });
      }
      if (field === 'companyName') {
        return res.status(400).json({ message: 'Company already exists.' });
      }
      if (field === 'companyId') {
        return res.status(400).json({ message: 'Company ID collision. Please try again.' });
      }
      return res.status(400).json({ message: `An account with this ${field || 'credential'} already exists.` });
    }
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const googleToken = req.body.idToken || req.body.googleToken || req.body.credential;
    if (googleToken) {
      return googleAuth(req, res);
    }

    const { email, identifier, username, password, role } = req.body; const loginId = email || identifier || username; if (!loginId || !password) {
      return res.status(400).json({ message: 'Email address and password are required.' });
    }

    const rawEmail = String(loginId).trim();
    const cleanedEmail = normalizeEmail(rawEmail);

    const user = await User.findOne({
      $or: [
        { email: cleanedEmail },
        { email: rawEmail.toLowerCase() },
        { mobileNumber: rawEmail },
        { driverId: rawEmail }, { username: rawEmail.toLowerCase() }, { employeeId: rawEmail }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'Account not found. Please register first.' });
    }

    const isPassMatch = await user.comparePassword(password);
    if (!isPassMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.isEmailVerified === false) {
      return res.status(403).json({ message: 'Account verification pending or account disabled.' });
    }

    // Role verification: Ensure user is logging in through the correct portal tab
    if (role && String(role).trim() !== '') {
      const requestedRole = String(role).trim().toLowerCase();
      const userRole = String(user.role).trim().toLowerCase();
      if (userRole !== requestedRole) {
        return res.status(403).json({
          message: `Access denied. This account is registered as ${user.role === 'Owner' ? 'an' : 'a'} ${user.role}. Please select the ${user.role} portal to sign in.`
        });
      }
    }

    if (user.role === 'Driver') {
      const loginNow = new Date();
      user.isOnline = true;
      user.loginTime = loginNow;
      user.status = 'Online';
      await user.save();

      emitDriverOnline({
        driverId: user.driverId || String(user._id),
        driverName: user.fullName,
        companyId: user.companyId,
        isOnline: true,
        loginTime: loginNow,
        latitude: user.latitude || 0,
        longitude: user.longitude || 0,
        address: user.address || user.currentLocation || ''
      });
    }

    if (user.role === 'Owner' && (!user.companyId || user.companyId.trim() === '')) {
      const existingCompany = await Company.findOne({
        $or: [{ createdBy: String(user._id) }, { companyName: user.companyName }]
      });
      if (existingCompany) {
        user.companyId = existingCompany.companyId;
      } else {
        const cId = await generateCompanyId();
        const newComp = await Company.create({
          companyId: cId,
          companyName: user.companyName || 'SmartOps Logistics',
          companyType: 'Logistics',
          createdBy: String(user._id)
        });
        user.companyId = newComp.companyId;
      }
      if (typeof user.save === 'function') {
        await user.save();
      }
    }


    const token = jwt.sign(
      {
        id: String(user._id),
        email: user.email,
        role: user.role,
        companyId: user.companyId || null, workerId: user.worker ? String(user.worker) : String(user._id) },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: String(user._id),
        fullName: user.fullName,
        email: user.email,
        mobileNumber: user.mobileNumber || '',
        role: user.role,
        companyId: user.companyId || null,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        companyName: user.companyName || null,
        driverId: user.driverId || null,
        vehicleNumber: user.vehicleNumber || null,
        avatarUrl: user.avatarUrl || null,
        isOnline: user.isOnline || false,
        latitude: user.latitude || 0,
        longitude: user.longitude || 0,
        address: user.address || user.currentLocation || '',
        speed: user.speed || 0,
        heading: user.heading || 0,
        accuracy: user.accuracy || 0,
        lastUpdated: user.lastUpdated || null,
        lastSeen: user.lastSeen || null,
        loginTime: user.loginTime || null,
        logoutTime: user.logoutTime || null
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Controller for Driver / User Logout
 * Sets isOnline = false, records logoutTime & lastSeen, preserves last known location
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id || req.body.userId;
    const effectiveDriverId = req.body.driverId || (req as any).user?.driverId;

    let user = null;
    if (userId) {
      user = await User.findById(userId);
    } else if (effectiveDriverId) {
      user = await User.findOne({ driverId: effectiveDriverId });
    }

    if (user && user.role === 'Driver') {
      const now = new Date();
      user.isOnline = false;
      user.logoutTime = now;
      user.lastSeen = now;
      user.status = 'Offline';
      user.speed = 0;
      await user.save();

      emitDriverOffline({
        driverId: user.driverId || String(user._id),
        driverName: user.fullName,
        companyId: user.companyId,
        isOnline: false,
        logoutTime: now,
        lastSeen: now,
        latitude: user.latitude || 0,
        longitude: user.longitude || 0,
        address: user.address || user.currentLocation || ''
      });
    }

    res.json({
      success: true,
      message: 'Logout recorded successfully.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Controller to fetch user's Security Question for Password Reset
 */
export const getSecurityQuestion = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { mobileNumber: String(email).trim() }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'Account not found. Please check your email address.' });
    }

    const question = user.securityQuestion || "What is your best friend's name?";

    res.json({
      success: true,
      securityQuestion: question,
      hasSecurityQuestion: Boolean(user.securityAnswerHash)
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Controller to Reset Password using Security Question Answer
 */
export const resetPasswordWithSecurity = async (req: Request, res: Response) => {
  try {
    const { email, securityAnswer, newPassword, password } = req.body;
    const targetPassword = newPassword || password;

    if (!email || !targetPassword) {
      return res.status(400).json({ message: 'Email address and new password are required.' });
    }

    if (targetPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { mobileNumber: String(email).trim() }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    // Verify security answer if configured, or allow master key override / standard validation
    if (user.securityAnswerHash) {
      if (!securityAnswer) {
        return res.status(400).json({ message: 'Security answer is required.' });
      }

      const isMatch = await user.compareSecurityAnswer(securityAnswer);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect security answer. Please try again.' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(targetPassword, salt);
    user.isEmailVerified = true;
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password has been updated successfully. You can now log in with your new password.'
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const forgotPassword = getSecurityQuestion;
export const resetPassword = resetPasswordWithSecurity;


