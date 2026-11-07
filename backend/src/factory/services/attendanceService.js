const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');
const Worker = require('../models/Worker');
const salaryService = require('./salaryService');
const mongoose = require('mongoose');

class AttendanceService {
  async getBranchForUser(requestingUser) {
    if (!requestingUser) return 'Pune Head Office';
    if (requestingUser.branch) return requestingUser.branch;
    if (requestingUser.unit) return requestingUser.unit;
    if (requestingUser.id || requestingUser._id) {
      const User = require('../models/User');
      const u = await User.findById(requestingUser.id || requestingUser._id);
      if (u && (u.branch || u.unit)) return u.branch || u.unit;
    }
    return 'Pune Head Office';
  }

  async verifyAttendanceModificationAuth(targetWorkerId, requestingUser) {
    if (!requestingUser) return;
    const roleLower = (requestingUser.role || '').toLowerCase();
    if (roleLower === 'supervisor' || roleLower === 'manager') {
      if (!targetWorkerId) {
        const error = new Error('Worker ID is required to modify attendance.');
        error.statusCode = 400;
        throw error;
      }
      const targetWorker = await Worker.findById(targetWorkerId).populate('user');
      if (!targetWorker) {
        const error = new Error('Target worker profile not found.');
        error.statusCode = 404;
        throw error;
      }

      // 1. Check if target worker is a Supervisor, Admin, Owner, Manager, or the requesting user themselves
      const targetWorkerRole = (targetWorker.role || (targetWorker.user ? targetWorker.user.role : '') || '').toLowerCase();
      const targetUserId = targetWorker.user ? targetWorker.user._id.toString() : null;
      const requestingUserId = requestingUser.id ? requestingUser.id.toString() : (requestingUser._id ? requestingUser._id.toString() : null);

      if (['supervisor', 'admin', 'owner', 'manager'].includes(targetWorkerRole) || (targetUserId && targetUserId === requestingUserId)) {
        const error = new Error('Access Denied: Supervisors cannot edit their own attendance or another supervisor\'s attendance.');
        error.statusCode = 403;
        throw error;
      }

      // 2. Check Branch isolation
      const userBranch = await this.getBranchForUser(requestingUser);
      const targetBranch = targetWorker.branch || targetWorker.assignedSite || 'Pune Head Office';
      if (userBranch !== targetBranch) {
        const error = new Error('Access Denied: You can only manage attendance for workers in your assigned branch.');
        error.statusCode = 403;
        throw error;
      }
    }
  }

  async getAllAttendance(queryParams, requestingUser) {
    const { worker, date, status } = queryParams || {};
    let query = {};

    if (requestingUser) {
      const roleLower = (requestingUser.role || '').toLowerCase();
      if (roleLower === 'supervisor' || roleLower === 'manager') {
        const userBranch = await this.getBranchForUser(requestingUser);
        const branchWorkers = await Worker.find({
          $or: [{ branch: userBranch }, { assignedSite: userBranch }]
        }).select('_id');
        const branchWorkerIds = branchWorkers.map(w => w._id);
        if (worker) {
          query.worker = worker;
        } else {
          query.worker = { $in: branchWorkerIds };
        }
      } else if (worker) {
        query.worker = worker;
      }
    } else if (worker) {
      query.worker = worker;
    }

    if (status) query.status = status;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }
    return await Attendance.find(query).populate('worker').sort({ date: -1 });
  }

  async getMyAttendance(workerId, queryParams, userId) {
    let query = {};
    const conditions = [];
    if (workerId && mongoose.isValidObjectId(workerId)) conditions.push({ worker: workerId });
    if (userId && mongoose.isValidObjectId(userId)) conditions.push({ user: userId });
    if (conditions.length > 1) {
      query.$or = conditions;
    } else if (conditions.length === 1) {
      query = conditions[0];
    }
    return await Attendance.find(query).populate('worker').sort({ date: -1 });
  }

  async getAttendanceById(id) {
    const record = await Attendance.findById(id).populate('worker');
    if (!record) {
      const error = new Error('Attendance record not found');
      error.statusCode = 404;
      throw error;
    }
    return record;
  }

  async createAttendance(data, requestingUser) {
    await this.verifyAttendanceModificationAuth(data.worker, requestingUser);

    const record = await Attendance.create(data);
    const populated = await Attendance.findById(record._id).populate('worker');

    if (record.worker) {
      const workerObj = await Worker.findById(record.worker);
      await Notification.create({
        worker: record.worker,
        user: workerObj ? workerObj.user : null,
        title: 'Attendance Updated',
        message: `Attendance for ${new Date(record.date).toLocaleDateString()} marked as ${record.status}`,
        description: `Status: ${record.status}, Check-in: ${record.checkInTime || '-'}`,
        type: 'attendance'
      });

      // Auto recalculate salary
      const targetMonth = `${new Date(record.date || Date.now()).toLocaleString('en-US', { month: 'long' })} ${new Date(record.date || Date.now()).getFullYear()}`;
      salaryService.recalculateAndSaveSalary(record.worker, targetMonth, 'Auto_Attendance_Create').catch(e => console.error(e));
    }
    return populated;
  }

  async updateAttendance(id, data, requestingUser) {
    const existing = await Attendance.findById(id);
    if (!existing) {
      const error = new Error('Attendance record not found');
      error.statusCode = 404;
      throw error;
    }

    await this.verifyAttendanceModificationAuth(existing.worker, requestingUser);

    const record = await Attendance.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true
    }).populate('worker');

    if (record.worker) {
      const workerObj = await Worker.findById(record.worker);
      await Notification.create({
        worker: record.worker,
        user: workerObj ? workerObj.user : null,
        title: 'Attendance Updated',
        message: `Attendance log modified: ${record.status}`,
        type: 'attendance'
      });

      // Auto recalculate salary
      const targetMonth = `${new Date(record.date || Date.now()).toLocaleString('en-US', { month: 'long' })} ${new Date(record.date || Date.now()).getFullYear()}`;
      salaryService.recalculateAndSaveSalary(record.worker, targetMonth, 'Auto_Attendance_Update').catch(e => console.error(e));
    }

    return record;
  }

  async deleteAttendance(id, requestingUser) {
    const existing = await Attendance.findById(id);
    if (!existing) {
      const error = new Error('Attendance record not found');
      error.statusCode = 404;
      throw error;
    }

    await this.verifyAttendanceModificationAuth(existing.worker, requestingUser);

    const record = await Attendance.findByIdAndDelete(id);

    if (record.worker) {
      const targetMonth = `${new Date(record.date || Date.now()).toLocaleString('en-US', { month: 'long' })} ${new Date(record.date || Date.now()).getFullYear()}`;
      salaryService.recalculateAndSaveSalary(record.worker, targetMonth, 'Auto_Attendance_Delete').catch(e => console.error(e));
    }

    return true;
  }

  async checkIn(workerId, userId, details = {}) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    let workerObj = null;
    if (workerId && mongoose.isValidObjectId(workerId)) {
      workerObj = await Worker.findById(workerId);
    }
    if (!workerObj && userId && mongoose.isValidObjectId(userId)) {
      workerObj = await Worker.findOne({ user: userId });
    }
    if (!workerObj && workerId && mongoose.isValidObjectId(workerId)) {
      workerObj = await Worker.findOne({ user: workerId });
    }

    if (!workerObj) {
      const UserModel = mongoose.models.User || require('../models/User');
      let userDoc = null;
      if (userId && mongoose.isValidObjectId(userId)) {
        userDoc = await UserModel.findById(userId).catch(() => null);
      }
      workerObj = await Worker.create({
        name: userDoc?.fullName || userDoc?.name || details.employeeName || 'Worker',
        email: userDoc?.email || `worker_${Date.now()}@smartops.local`,
        employeeId: userDoc?.employeeId || `EMP-${Date.now().toString().slice(-4)}`,
        department: userDoc?.department || 'Operations',
        designation: userDoc?.role === 'Supervisor' ? 'Floor Supervisor' : 'Floor Operator',
        role: userDoc?.role || 'Worker',
        salary: userDoc?.role === 'Supervisor' ? 45000 : 25000,
        status: 'Active',
        assignedSite: userDoc?.branch || 'Pune Head Office',
        branch: userDoc?.branch || 'Pune Head Office',
        user: userId && mongoose.isValidObjectId(userId) ? userId : undefined
      });
      if (userDoc) {
        userDoc.worker = workerObj._id;
        await userDoc.save().catch(() => {});
      }
    }

    workerId = workerObj._id;

    const existingConditions = [];
    if (workerId && mongoose.isValidObjectId(workerId)) existingConditions.push({ worker: workerId });
    if (userId && mongoose.isValidObjectId(userId)) existingConditions.push({ user: userId });

    const existing = await Attendance.findOne({
      ...(existingConditions.length > 1 ? { $or: existingConditions } : (existingConditions[0] || {})),
      date: { $gte: todayStart, $lte: todayEnd }
    });

    if (existing) {
      return await Attendance.findById(existing._id).populate('worker');
    }

    const shift = details.shift || workerObj.shiftTiming || '9:00 AM - 6:00 PM';
    let isLate = false;
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    let shiftStartHour = 9;
    let shiftStartMinute = 0;

    try {
      const startTimeStr = shift.split('-')[0].trim();
      const parts = startTimeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
      if (parts) {
        let h = parseInt(parts[1], 10);
        const m = parseInt(parts[2], 10);
        const ampm = parts[3].toUpperCase();
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        shiftStartHour = h;
        shiftStartMinute = m;
      }
    } catch (e) {
      console.error('Failed to parse shift start time', e);
    }

    const graceTimeMinutes = shiftStartHour * 60 + shiftStartMinute + 15;
    const currentTimeMinutes = currentHours * 60 + currentMinutes;

    if (currentTimeMinutes > graceTimeMinutes) {
      isLate = true;
    }

    const attendanceType = isLate ? 'Late' : 'Present';
    const status = isLate ? 'Late' : 'Present';

    const formatTimeStr = (date) => {
      let hours = date.getHours();
      let minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      minutes = minutes < 10 ? '0' + minutes : minutes;
      return `${hours}:${minutes} ${ampm}`;
    };

    const checkInTimeStr = formatTimeStr(now);

    const record = await Attendance.create({
      worker: workerId,
      user: userId,
      date: now,
      checkIn: now,
      checkInTime: checkInTimeStr,
      status,
      attendanceType,
      shift,
      supervisorName: 'Auto System',
      remarks: details.remarks || '',
      employeeId: workerObj.employeeId || '',
      employeeName: workerObj.name || '',
      role: workerObj.role || 'Worker',
      department: workerObj.department || 'Operations',
      site: details.site || workerObj.assignedSite || 'Pune Head Office',
      latitude: details.latitude,
      longitude: details.longitude,
      address: details.address || '',
      ipAddress: details.ipAddress || '',
      device: details.device || 'Desktop',
      checkInDetails: {
        time: now,
        location: details.address ? `${details.latitude},${details.longitude} (${details.address})` : `${details.latitude},${details.longitude}`,
        geofenceStatus: details.isWithinRange ? 'Within Range' : 'Out of Range',
        deviceId: details.device || 'Desktop',
        ipAddress: details.ipAddress || '',
        authMethod: 'Face ID'
      }
    });

    await Notification.create({
      worker: workerId,
      user: userId,
      title: 'Shift Checked In',
      message: `Checked in at ${checkInTimeStr} (${attendanceType})`,
      description: `GPS: ${details.latitude}, ${details.longitude} - Address: ${details.address || 'N/A'}`,
      type: 'attendance'
    });

    // Auto recalculate salary
    const targetMonth = `${now.toLocaleString('en-US', { month: 'long' })} ${now.getFullYear()}`;
    salaryService.recalculateAndSaveSalary(workerId, targetMonth, 'Auto_CheckIn').catch(e => console.error(e));

    return await Attendance.findById(record._id).populate('worker');
  }

  async checkOut(workerId, userId, details = {}) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    let workerObj = null;
    if (workerId && mongoose.isValidObjectId(workerId)) {
      workerObj = await Worker.findById(workerId);
    }
    if (!workerObj && userId && mongoose.isValidObjectId(userId)) {
      workerObj = await Worker.findOne({ user: userId });
    }
    if (workerObj) {
      workerId = workerObj._id;
    }

    const checkOutConditions = [];
    if (workerId && mongoose.isValidObjectId(workerId)) checkOutConditions.push({ worker: workerId });
    if (userId && mongoose.isValidObjectId(userId)) checkOutConditions.push({ user: userId });

    const record = await Attendance.findOne({
      ...(checkOutConditions.length > 1 ? { $or: checkOutConditions } : (checkOutConditions[0] || {})),
      date: { $gte: todayStart, $lte: todayEnd }
    });

    if (!record) {
      const error = new Error('No check-in record found for today. Please check in first.');
      error.statusCode = 400;
      throw error;
    }

    if (record.checkOut) {
      return await Attendance.findById(record._id).populate('worker');
    }

    const now = new Date();
    const formatTimeStr = (date) => {
      let hours = date.getHours();
      let minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      minutes = minutes < 10 ? '0' + minutes : minutes;
      return `${hours}:${minutes} ${ampm}`;
    };

    const checkOutTimeStr = formatTimeStr(now);
    record.checkOut = now;
    record.checkOutTime = checkOutTimeStr;

    const diffMs = now - record.checkIn;
    const workingHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    record.workingHours = workingHours;
    record.totalWorkedHours = workingHours;

    if (workingHours < 4) {
      record.status = 'Half Day';
      record.attendanceType = 'Half Day';
    }

    if (workingHours > 8) {
      record.overtimeHours = Math.round((workingHours - 8) * 100) / 100;
    }

    record.checkOutDetails = {
      time: now,
      location: details.address ? `${details.latitude},${details.longitude} (${details.address})` : `${details.latitude},${details.longitude}`,
      geofenceStatus: details.isWithinRange ? 'Within Range' : 'Out of Range',
      deviceId: details.device || 'Desktop',
      ipAddress: details.ipAddress || '',
      authMethod: 'Face ID'
    };

    if (details.latitude) record.latitude = details.latitude;
    if (details.longitude) record.longitude = details.longitude;
    if (details.address) record.address = details.address;
    if (details.ipAddress) record.ipAddress = details.ipAddress;
    if (details.device) record.device = details.device;

    await record.save();

    await Notification.create({
      worker: workerId,
      user: userId,
      title: 'Shift Checked Out',
      message: `Checked out at ${checkOutTimeStr}. Total hours: ${workingHours} hrs.`,
      description: `Worked hours: ${workingHours} hrs. Overtime: ${record.overtimeHours} hrs.`,
      type: 'attendance'
    });

    // Auto recalculate salary
    const targetMonth = `${now.toLocaleString('en-US', { month: 'long' })} ${now.getFullYear()}`;
    salaryService.recalculateAndSaveSalary(workerId, targetMonth, 'Auto_CheckOut').catch(e => console.error(e));

    return await Attendance.findById(record._id).populate('worker');
  }

  async getTodayAttendance(workerId, userId) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const conditions = [];
    if (workerId && mongoose.isValidObjectId(workerId)) conditions.push({ worker: workerId });
    if (userId && mongoose.isValidObjectId(userId)) conditions.push({ user: userId });

    if (conditions.length === 0) {
      return null;
    }

    return await Attendance.findOne({
      ...(conditions.length > 1 ? { $or: conditions } : (conditions[0] || {})),
      date: { $gte: todayStart, $lte: todayEnd }
    }).populate('worker');
  }

  async getAttendanceMonth(workerId, month, year) {
    const targetMonth = month ? parseInt(month, 10) - 1 : new Date().getMonth();
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();

    const start = new Date(targetYear, targetMonth, 1);
    const end = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const records = await Attendance.find({
      worker: workerId,
      date: { $gte: start, $lte: end }
    });

    const presentCount = records.filter(r => r.status === 'Present').length;
    const lateCount = records.filter(r => r.status === 'Late').length;
    const halfDayCount = records.filter(r => r.status === 'Half Day').length;
    const leaveCount = records.filter(r => r.status === 'Leave').length;
    const absentCount = records.filter(r => r.status === 'Absent').length;

    const totalDaysMarked = presentCount + lateCount + halfDayCount + absentCount;
    const attendancePercentage = totalDaysMarked > 0 
      ? Math.round(((presentCount + lateCount + halfDayCount * 0.5) / totalDaysMarked) * 100) 
      : 0;

    let totalWorkingHours = 0;
    let totalOvertimeHours = 0;
    records.forEach(r => {
      totalWorkingHours += r.workingHours || 0;
      totalOvertimeHours += r.overtimeHours || 0;
    });

    const lastRecord = records.sort((a, b) => b.date - a.date)[0] || null;

    return {
      records,
      stats: {
        presentCount,
        lateCount,
        halfDayCount,
        leaveCount,
        absentCount,
        attendancePercentage,
        totalWorkingHours: Math.round(totalWorkingHours * 100) / 100,
        totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
        lastCheckIn: lastRecord ? lastRecord.checkInTime : '-',
        lastCheckOut: lastRecord ? lastRecord.checkOutTime : '-'
      }
    };
  }
}

module.exports = new AttendanceService();
