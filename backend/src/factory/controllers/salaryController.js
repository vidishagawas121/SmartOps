const salaryService = require('../services/salaryService');
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

class SalaryController {
  async getAllSalaries(req, res, next) {
    try {
      const userRole = req.user ? req.user.role : '';
      if (userRole.toLowerCase() === 'worker') {
        const worker = await resolveWorkerForRequest(req);
        const workerId = worker ? worker._id : (req.user ? req.user.workerId : null);
        const userId = req.user ? (req.user.id || req.user._id) : null;
        if (!workerId && !userId) {
          return res.status(200).json({ success: true, count: 0, data: [] });
        }
        const logs = await salaryService.getMySalaries(workerId, req.query, userId);
        return res.status(200).json({ success: true, count: logs.length, data: logs });
      }
      const logs = await salaryService.getAllSalaries(req.query);
      res.status(200).json({ success: true, count: logs.length, data: logs });
    } catch (err) {
      next(err);
    }
  }

  async getMySalaries(req, res, next) {
    try {
      const worker = await resolveWorkerForRequest(req);
      const workerId = worker ? worker._id : (req.user ? req.user.workerId : req.query.workerId);
      const userId = req.user ? (req.user.id || req.user._id) : null;
      if (!workerId && !userId) {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }
      const logs = await salaryService.getMySalaries(workerId, req.query, userId);
      res.status(200).json({ success: true, count: logs.length, data: logs });
    } catch (err) {
      next(err);
    }
  }

  async calculateSalary(req, res, next) {
    try {
      let worker = req.query.worker;
      if (!worker) {
        const resolved = await resolveWorkerForRequest(req);
        if (resolved) worker = resolved._id;
      }
      const { month } = req.query;
      const calc = await salaryService.calculateSalary(worker, month);
      res.status(200).json({ success: true, data: calc });
    } catch (err) {
      next(err);
    }
  }

  async setMonthlySalary(req, res, next) {
    try {
      const userRole = req.user ? req.user.role : '';
      if (userRole.toLowerCase() === 'worker') {
        return res.status(403).json({ success: false, message: 'Access denied: Workers cannot edit salary' });
      }
      const { workerId, salary, month } = req.body;
      const log = await salaryService.setMonthlySalary(workerId, salary, month);
      res.status(200).json({ success: true, data: log });
    } catch (err) {
      next(err);
    }
  }

  async createSalary(req, res, next) {
    try {
      const userRole = req.user ? req.user.role : '';
      if (userRole.toLowerCase() === 'worker') {
        return res.status(403).json({ success: false, message: 'Access denied: Workers cannot edit salary' });
      }
      const log = await salaryService.createSalary(req.body);
      res.status(201).json({ success: true, data: log });
    } catch (err) {
      next(err);
    }
  }

  async getSalaryById(req, res, next) {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return next();
      }
      const log = await salaryService.getSalaryById(req.params.id);
      res.status(200).json({ success: true, data: log });
    } catch (err) {
      next(err);
    }
  }

  async updateSalary(req, res, next) {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return next();
      }
      const userRole = req.user ? req.user.role : '';
      if (userRole.toLowerCase() === 'worker') {
        return res.status(403).json({ success: false, message: 'Access denied: Workers cannot edit salary' });
      }
      const log = await salaryService.updateSalary(req.params.id, req.body);
      res.status(200).json({ success: true, data: log });
    } catch (err) {
      next(err);
    }
  }

  async deleteSalary(req, res, next) {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return next();
      }
      const userRole = req.user ? req.user.role : '';
      if (userRole.toLowerCase() === 'worker') {
        return res.status(403).json({ success: false, message: 'Access denied: Workers cannot delete salary' });
      }
      await salaryService.deleteSalary(req.params.id);
      res.status(200).json({ success: true, data: {} });
    } catch (err) {
      next(err);
    }
  }

  async approveOvertime(req, res, next) {
    try {
      const userRole = req.user ? req.user.role : '';
      if (userRole.toLowerCase() === 'worker') {
        return res.status(403).json({ success: false, message: 'Access denied: Workers cannot approve overtime' });
      }
      const ot = await salaryService.approveOvertime(req.body);
      res.status(200).json({ success: true, data: ot });
    } catch (err) {
      next(err);
    }
  }

  async getOvertimeHistory(req, res, next) {
    try {
      const resolved = await resolveWorkerForRequest(req);
      const workerId = req.query.worker || (resolved ? resolved._id : (req.user ? req.user.workerId : null));
      const history = await salaryService.getOvertimeHistory(workerId);
      res.status(200).json({ success: true, count: history.length, data: history });
    } catch (err) {
      next(err);
    }
  }

  async getSalaryHistory(req, res, next) {
    try {
      const resolved = await resolveWorkerForRequest(req);
      const workerId = req.query.worker || (resolved ? resolved._id : (req.user ? req.user.workerId : null));
      const history = await salaryService.getSalaryHistory(workerId);
      res.status(200).json({ success: true, count: history.length, data: history });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SalaryController();
