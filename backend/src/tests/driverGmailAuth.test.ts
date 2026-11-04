import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/authRoutes';
import User from '../models/User';
import Company from '../models/Company';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

jest.mock('../models/User');
jest.mock('../models/Company');
jest.mock('../models/VerificationCode');
jest.mock('../utils/otpService');

describe('Secure Driver & Owner Authentication & OTP Verification API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new Owner account successfully', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (Company.findOne as jest.Mock).mockResolvedValue(null);
      (Company.create as jest.Mock).mockResolvedValue({ companyId: 'CMP-1001' });

      const mockOwner = {
        _id: 'owner-id-101',
        fullName: 'Rehan Chaudhari',
        email: 'rehan.owner@gmail.com',
        mobileNumber: '9876500000',
        role: 'Owner',
        companyName: 'SmartOps Logistics',
        companyId: 'CMP-1001',
        isEmailVerified: true,
        save: jest.fn().mockResolvedValue(true)
      };

      (User as unknown as jest.Mock).mockImplementation(function() {
        return mockOwner;
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Rehan Chaudhari',
          email: 'rehan.owner@gmail.com',
          mobileNumber: '9876500000',
          role: 'Owner',
          password: 'securepassword123',
          companyName: 'SmartOps Logistics',
          companyType: 'Logistics'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Registration completed successfully');
    });

    it('should reject registration if email already exists', async () => {
      (User.findOne as jest.Mock).mockImplementation(async (query: any) => {
        if (query.email === 'duplicate@gmail.com') return { email: 'duplicate@gmail.com' };
        return null;
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Duplicate User',
          email: 'duplicate@gmail.com',
          mobileNumber: '9876543210',
          role: 'Owner',
          password: 'securepassword123',
          companyName: 'Duplicate Company',
          companyType: 'Logistics'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('This email is already registered.');
    });

    it('should reject registration if mobile number already exists', async () => {
      (User.findOne as jest.Mock).mockImplementation(async (query: any) => {
        if (query.mobileNumber === '9999988888') return { mobileNumber: '9999988888' };
        return null;
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Mobile User',
          email: 'unique@gmail.com',
          mobileNumber: '9999988888',
          role: 'Owner',
          password: 'securepassword123',
          companyName: 'Unique Company',
          companyType: 'Logistics'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('This mobile number is already registered.');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 404 if user account does not exist', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@gmail.com',
          password: 'password123'
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Account not found. Please register first.');
    });

    it('should return 403 if user account is disabled or unverified', async () => {
      const mockUnverifiedUser = {
        _id: 'user-101',
        email: 'unverified@gmail.com',
        role: 'Driver',
        isEmailVerified: false,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true)
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUnverifiedUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unverified@gmail.com',
          password: 'securepassword123'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Account verification pending or account disabled.');
    });

    it('should authenticate verified user with correct password', async () => {
      const mockVerifiedUser = {
        _id: 'user-202',
        fullName: 'Verified Owner',
        email: 'owner@smartops.com',
        role: 'Owner',
        companyId: 'CMP-20202',
        isEmailVerified: true,
        save: jest.fn().mockResolvedValue(true),
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockVerifiedUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'owner@smartops.com',
          password: 'correctpassword123'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.isEmailVerified).toBe(true);
    });

    it('should reject Driver logging in from Owner portal', async () => {
      const mockDriverUser = {
        _id: 'driver-303',
        fullName: 'Test Driver',
        email: 'driver.gmail@gmail.com',
        role: 'Driver',
        companyId: 'CMP-20202',
        isEmailVerified: true,
        save: jest.fn().mockResolvedValue(true),
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockDriverUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'driver.gmail@gmail.com',
          password: 'driverpassword123',
          role: 'Owner'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied. This account is registered as a Driver. Please select the Driver portal to sign in.');
    });

    it('should reject Owner logging in from Driver portal', async () => {
      const mockOwnerUser = {
        _id: 'owner-404',
        fullName: 'Test Owner',
        email: 'owner.company@gmail.com',
        role: 'Owner',
        companyId: 'CMP-20202',
        isEmailVerified: true,
        save: jest.fn().mockResolvedValue(true),
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockOwnerUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'owner.company@gmail.com',
          password: 'ownerpassword123',
          role: 'Driver'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied. This account is registered as an Owner. Please select the Owner portal to sign in.');
    });

    it('should allow Driver to log in from Driver portal', async () => {
      const mockDriverUser = {
        _id: 'driver-505',
        fullName: 'Driver Gmail',
        email: 'driver.gmail@gmail.com',
        role: 'Driver',
        companyId: 'CMP-20202',
        isEmailVerified: true,
        save: jest.fn().mockResolvedValue(true),
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockDriverUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'driver.gmail@gmail.com',
          password: 'driverpassword123',
          role: 'Driver'
        });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('Driver');
    });
  });
});
