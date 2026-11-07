const attendanceService = require('../services/attendanceService');
const Worker = require('../models/Worker');
const mongoose = require('mongoose');

/**
 * Robustly resolves or provisions a Worker profile for the current user/request.
 */
async function resolveWorkerForRequest(req) {
  if (!req) return null;
  if (req.worker && req.worker._id) {
    return req.worker;
  }

  const user = req.user;
  if (!user) {
    const fallbackId = req.query?.workerId || req.body?.workerId;
    if (fallbackId && mongoose.isValidObjectId(fallbackId)) {
      return await Worker.findById(fallbackId);
    }
    return null;
  }

  const userId = user.id || user._id || user.userId;
  const directWorkerId = user.workerId || user.worker;

  // 1. Direct workerId lookup if valid ObjectId
  if (directWorkerId && mongoose.isValidObjectId(directWorkerId)) {
    const workerById = await Worker.findById(directWorkerId);
    if (workerById) {
      req.worker = workerById;
      return workerById;
    }
  }

  // 2. Direct lookup by linked user ID
  if (userId && mongoose.isValidObjectId(userId)) {
    const workerByUser = await Worker.findOne({ user: userId });
    if (workerByUser) {
      req.worker = workerByUser;
      return workerByUser;
    }
  }

  // 3. Lookup by email address
  const userEmail = user.email;
  if (userEmail) {
    const workerByEmail = await Worker.findOne({ email: userEmail.toLowerCase().trim() });
    if (workerByEmail) {
      if (!workerByEmail.user && userId && mongoose.isValidObjectId(userId)) {
        workerByEmail.user = userId;
        await workerByEmail.save().catch(() => {});
      }
      req.worker = workerByEmail;
      return workerByEmail;
    }
  }

  // 4. Lookup user document in DB for worker reference
  if (userId && mongoose.isValidObjectId(userId)) {
    try {
      const UserModel = mongoose.models.User || require('../models/User');
      const userDoc = await UserModel.findById(userId);
      if (userDoc) {
        if (userDoc.worker && mongoose.isValidObjectId(userDoc.worker)) {
          const w = await Worker.findById(userDoc.worker);
          if (w) {
            req.worker = w;
            return w;
          }
        }
        if (userDoc.email) {
          const w = await Worker.findOne({ email: userDoc.email.toLowerCase().trim() });
          if (w) {
            if (!w.user) {
              w.user = userDoc._id;
              await w.save().catch(() => {});
            }
            req.worker = w;
            return w;
          }
        }

        // Auto-provision Worker profile so operations are never blocked
        const workerRole = userDoc.role || user.role || 'Worker';
        const newWorker = await Worker.create({
          name: userDoc.fullName || userDoc.name || user.name || 'Operations Worker',
          email: userDoc.email || user.email || `worker_${userId}@smartops.local`,
          employeeId: userDoc.employeeId || `EMP-${Date.now().toString().slice(-4)}`,
          department: userDoc.department || 'Operations',
          designation: workerRole === 'Supervisor' ? 'Floor Supervisor' : 'Floor Operator',
          role: ['Worker', 'Supervisor', 'Owner', 'Employee', 'Manager', 'Admin'].includes(workerRole) ? workerRole : 'Worker',
          salary: workerRole === 'Supervisor' ? 45000 : 25000,
          status: 'Active',
          assignedSite: userDoc.branch || user.branch || 'Pune Head Office',
          branch: userDoc.branch || user.branch || 'Pune Head Office',
          user: userDoc._id
        });

        userDoc.worker = newWorker._id;
        await userDoc.save().catch(() => {});
        req.worker = newWorker;
        return newWorker;
      }
    } catch (e) {
      console.warn('[resolveWorkerForRequest lookup error]', e);
    }
  }

  // 5. Fallback auto-provision if user exists in token context
  if (userId && mongoose.isValidObjectId(userId)) {
    try {
      const fallbackWorker = await Worker.create({
        name: user.name || user.fullName || 'Operations Worker',
        email: user.email || `worker_${userId}@smartops.local`,
        employeeId: `EMP-${Date.now().toString().slice(-4)}`,
        department: user.department || 'Operations',
        designation: user.role === 'Supervisor' ? 'Floor Supervisor' : 'Floor Operator',
        role: ['Worker', 'Supervisor', 'Owner', 'Employee', 'Manager', 'Admin'].includes(user.role) ? user.role : 'Worker',
        salary: user.role === 'Supervisor' ? 45000 : 25000,
        status: 'Active',
        assignedSite: user.branch || 'Pune Head Office',
        branch: user.branch || 'Pune Head Office',
        user: userId
      });
      req.worker = fallbackWorker;
      return fallbackWorker;
    } catch (createErr) {
      console.warn('[resolveWorkerForRequest fallback create error]', createErr);
    }
  }

  return null;
}

class AttendanceController {
  async getAllAttendance(req, res, next) {
    try {
      if (req.user && req.user.role && req.user.role.toLowerCase() === 'worker') {
        const worker = await resolveWorkerForRequest(req);
        const workerId = worker ? worker._id : (req.user ? req.user.workerId : null);
        const userId = req.user ? (req.user.id || req.user._id) : null;
        if (!workerId && !userId) {
          return res.status(200).json({ success: true, count: 0, data: [] });
        }
        const records = await attendanceService.getMyAttendance(workerId, req.query, userId);
        return res.status(200).json({ success: true, count: records.length, data: records });
      }
      const records = await attendanceService.getAllAttendance(req.query, req.user);
      res.status(200).json({ success: true, count: records.length, data: records });
    } catch (err) {
      next(err);
    }
  }

  async getMyAttendance(req, res, next) {
    try {
      const worker = await resolveWorkerForRequest(req);
      const workerId = worker ? worker._id : (req.user ? req.user.workerId : req.query.workerId);
      const userId = req.user ? (req.user.id || req.user._id) : null;
      const records = await attendanceService.getMyAttendance(workerId, req.query, userId);
      res.status(200).json({ success: true, count: records.length, data: records });
    } catch (err) {
      next(err);
    }
  }

  async getAttendanceById(req, res, next) {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return next();
      }
      const record = await attendanceService.getAttendanceById(req.params.id);
      res.status(200).json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  }

  async createAttendance(req, res, next) {
    try {
      const userRole = req.user ? req.user.role : '';
      const isAuthorized = userRole.toLowerCase() === 'owner' || userRole.toLowerCase() === 'supervisor';
      if (!isAuthorized) {
        return res.status(403).json({ success: false, error: 'Only Supervisors can record attendance' });
      }
      const record = await attendanceService.createAttendance(req.body, req.user);
      res.status(201).json({ success: true, data: record });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ success: false, error: err.message, message: err.message });
      }
      next(err);
    }
  }

  async updateAttendance(req, res, next) {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return next();
      }
      const userRole = req.user ? req.user.role : '';
      const isAuthorized = userRole.toLowerCase() === 'owner' || userRole.toLowerCase() === 'supervisor';
      if (!isAuthorized) {
        return res.status(403).json({ success: false, error: 'Only Supervisors can modify attendance' });
      }
      const record = await attendanceService.updateAttendance(req.params.id, req.body, req.user);
      res.status(200).json({ success: true, data: record });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ success: false, error: err.message, message: err.message });
      }
      next(err);
    }
  }

  async deleteAttendance(req, res, next) {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return next();
      }
      await attendanceService.deleteAttendance(req.params.id, req.user);
      res.status(200).json({ success: true, data: {} });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ success: false, error: err.message, message: err.message });
      }
      next(err);
    }
  }

  async checkIn(req, res, next) {
    try {
      const worker = await resolveWorkerForRequest(req);
      const workerId = worker ? worker._id : (req.user ? req.user.workerId : null);
      const userId = req.user ? (req.user.id || req.user._id) : null;
      if (!workerId && !userId) {
        return res.status(400).json({ success: false, error: 'No linked worker profile found for this user.' });
      }
      const record = await attendanceService.checkIn(workerId, userId, req.body);
      res.status(200).json({ success: true, data: record });
    } catch (err) {
      res.status(err.statusCode || 500).json({ success: false, error: err.message || 'Server Error' });
    }
  }

  async checkOut(req, res, next) {
    try {
      const worker = await resolveWorkerForRequest(req);
      const workerId = worker ? worker._id : (req.user ? req.user.workerId : null);
      const userId = req.user ? (req.user.id || req.user._id) : null;
      if (!workerId && !userId) {
        return res.status(400).json({ success: false, error: 'No linked worker profile found for this user.' });
      }
      const record = await attendanceService.checkOut(workerId, userId, req.body);
      res.status(200).json({ success: true, data: record });
    } catch (err) {
      res.status(err.statusCode || 500).json({ success: false, error: err.message || 'Server Error' });
    }
  }

  async getTodayAttendance(req, res, next) {
    try {
      const worker = await resolveWorkerForRequest(req);
      const workerId = worker ? worker._id : (req.user ? req.user.workerId : null);
      const userId = req.user ? (req.user.id || req.user._id) : null;
      if (!workerId && !userId) {
        return res.status(200).json({ success: true, data: null });
      }
      const record = await attendanceService.getTodayAttendance(workerId, userId);
      res.status(200).json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  }

  async getAttendanceMonth(req, res, next) {
    try {
      const worker = await resolveWorkerForRequest(req);
      const workerId = worker ? worker._id : (req.user ? req.user.workerId : req.query.workerId);
      if (!workerId) {
        return res.status(400).json({ success: false, error: 'Worker ID is required.' });
      }
      const result = await attendanceService.getAttendanceMonth(workerId, req.query.month, req.query.year);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getAttendanceReport(req, res, next) {
    try {
      const records = await attendanceService.getAllAttendance(req.query);
      res.status(200).json({ success: true, count: records.length, data: records });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AttendanceController();
