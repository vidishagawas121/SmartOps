import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Attendance from '../models/Attendance';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import { emitTelemetryUpdate } from '../sockets/telemetrySocket';

export const getAttendance = async (req: any, res: any) => {
  try {
    const filter: any = {};
    if (req.companyId) filter.companyId = req.companyId;
    const logs = await Attendance.find(filter).sort({ date: -1, createdAt: -1 });
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getHistory = async (req: any, res: any) => {
  try {
    const filter: any = {};
    if (req.companyId) filter.companyId = req.companyId;
    const logs = await Attendance.find(filter).sort({ createdAt: -1 });
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getLive = async (req: any, res: any) => {
  try {
    const filter: any = {
      currentStatus: { $in: ['On Duty', 'On Trip', 'On Break', 'Emergency'] }
    };
    if (req.companyId) filter.companyId = req.companyId;
    const logs = await Attendance.find(filter);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getAnalytics = async (req: any, res: any) => {
  try {
    const filter: any = {};
    if (req.companyId) filter.companyId = req.companyId;
    const logs = await Attendance.find(filter);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getByDriverId = async (req: any, res: any) => {
  try {
    const filter: any = { driverId: req.params.driverId };
    if (req.companyId) filter.companyId = req.companyId;
    const logs = await Attendance.find(filter).sort({ date: -1 });
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const startDuty = async (req: any, res: any) => {
  try {
    const { 
      driverId, 
      driverName, 
      employeeName, 
      checkInGPS, 
      checkInWarehouse, 
      checkInDeviceInfo, 
      checkInInternetStatus,
      vehicleNumber,
      latitude,
      longitude,
      address,
      checkInTime,
      browserInfo,
      deviceType
    } = req.body;
    const todayStr = new Date().toISOString().split('T')[0];

    let record = await Attendance.findOne({ driverId, date: todayStr });
    if (record) {
      return res.status(400).json({ message: 'Duty has already been initialized for today.' });
    }

    const finalTime = checkInTime || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    let attendanceStatus: 'Present' | 'Late' | 'Absent' = 'Present';
    const [timeVal, modifier] = finalTime.split(' ');
    const [hours, minutes] = timeVal.split(':').map(Number);
    let checkInHour = hours;
    if (modifier === 'PM' && hours !== 12) checkInHour += 12;
    if (modifier === 'AM' && hours === 12) checkInHour = 0;

    if (checkInHour > 8 || (checkInHour === 8 && minutes > 30)) {
      attendanceStatus = 'Late';
    }

    // Get driver's companyId
    let companyId = req.companyId;
    if (!companyId && driverId) {
      const driverUser = await User.findOne({ $or: [{ _id: mongoose.Types.ObjectId.isValid(driverId) ? driverId : undefined }, { driverId }] }).select('companyId');
      if (driverUser) companyId = driverUser.companyId;
    }

    const attendanceObjectId = new mongoose.Types.ObjectId();

    record = new Attendance({
      _id: attendanceObjectId,
      attendanceId: attendanceObjectId.toString(),
      companyId,
      employeeName: employeeName || driverName || 'Driver Operator',
      driverName: driverName || employeeName || 'Driver Operator',
      driverId,
      vehicleNumber: vehicleNumber || 'MH-12-QW-9874',
      checkIn: finalTime,
      checkInTime: finalTime,
      checkInGPS: checkInGPS || (latitude && longitude ? `${latitude}, ${longitude}` : ''),
      latitude: latitude,
      longitude: longitude,
      address: address || checkInWarehouse || 'Primary Warehouse Yard',
      checkInWarehouse: address || checkInWarehouse || 'Primary Warehouse Yard',
      checkInDeviceInfo: deviceType || checkInDeviceInfo || 'Android Device',
      checkInInternetStatus: checkInInternetStatus || 'Connected',
      workingHours: 0,
      breakDuration: 0,
      tripsCompleted: 0,
      distanceCovered: 0,
      fuelUsed: 0,
      overtime: 0,
      attendanceStatus,
      currentStatus: 'On Duty',
      performanceScore: 100,
      status: attendanceStatus,
      date: todayStr,
      breaks: [],
      timeline: [
        {
          time: finalTime,
          event: 'Driver Logged In',
          description: `Device: ${deviceType || checkInDeviceInfo || 'Unknown'}. Browser: ${browserInfo || 'Unknown'}. Internet: ${checkInInternetStatus || 'Active'}.`,
          gps: checkInGPS || (latitude && longitude ? `${latitude}, ${longitude}` : '')
        },
        {
          time: finalTime,
          event: 'Start Duty',
          description: `Duty successfully authorized at ${address || checkInWarehouse || 'Warehouse Point'}.`,
          gps: checkInGPS || (latitude && longitude ? `${latitude}, ${longitude}` : '')
        }
      ]
    });

    await record.save();
    emitTelemetryUpdate({ action: 'start-duty', driverId, record });
    res.status(201).json(record);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const startBreak = async (req: any, res: any) => {
  try {
    const { driverId, type, remarks, gps } = req.body;
    const todayStr = new Date().toISOString().split('T')[0];

    const record = await Attendance.findOne({ driverId, date: todayStr });
    if (!record) {
      return res.status(404).json({ message: 'Active duty sheet for today not found.' });
    }

    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    record.currentStatus = 'On Break';
    record.breaks.push({
      type,
      breakStart: timeStr,
      gps,
      remarks,
      duration: 0
    } as any);

    record.timeline.push({
      time: timeStr,
      event: 'Lunch Break',
      description: `Initiated halt: ${type}. Remarks: ${remarks || 'Standard Stop'}.`,
      gps
    } as any);

    await record.save();
    emitTelemetryUpdate({ action: 'start-break', driverId, record });
    res.json(record);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const endBreak = async (req: any, res: any) => {
  try {
    const { driverId, gps } = req.body;
    const todayStr = new Date().toISOString().split('T')[0];

    const record = await Attendance.findOne({ driverId, date: todayStr });
    if (!record) {
      return res.status(404).json({ message: 'Active duty sheet not found.' });
    }

    const activeBreak = record.breaks.find(b => !b.breakEnd);
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    if (activeBreak) {
      activeBreak.breakEnd = timeStr;
      
      const [sTime, sMod] = activeBreak.breakStart.split(' ');
      const [sH, sM] = sTime.split(':').map(Number);
      let startMin = sH * 60 + sM;
      if (sMod === 'PM' && sH !== 12) startMin += 720;
      if (sMod === 'AM' && sH === 12) startMin -= 720;

      const [eTime, eMod] = timeStr.split(' ');
      const [eH, eM] = eTime.split(':').map(Number);
      let endMin = eH * 60 + eM;
      if (eMod === 'PM' && eH !== 12) endMin += 720;
      if (eMod === 'AM' && eH === 12) endMin -= 720;

      const duration = Math.max(0, endMin - startMin);
      activeBreak.duration = duration;
      record.breakDuration = (record.breakDuration || 0) + duration;
    }

    record.currentStatus = 'On Duty';
    record.timeline.push({
      time: timeStr,
      event: 'Resume Duty',
      description: `Resumed active operations. Break duration was ${activeBreak?.duration || 0} mins.`,
      gps
    } as any);

    await record.save();
    emitTelemetryUpdate({ action: 'end-break', driverId, record });
    res.json(record);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const endDuty = async (req: any, res: any) => {
  try {
    const { driverId, checkOutGPS, tripsCompleted, distanceCovered, fuelUsed, checkOutTime, latitude, longitude, address } = req.body;
    const todayStr = new Date().toISOString().split('T')[0];

    const record = await Attendance.findOne({ driverId, date: todayStr });
    if (!record) {
      return res.status(404).json({ message: 'Duty has not been started today.' });
    }

    const finalCheckOutTime = checkOutTime || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const [sTime, sMod] = record.checkIn.split(' ');
    const [sH, sM] = sTime.split(':').map(Number);
    let startMin = sH * 60 + sM;
    if (sMod === 'PM' && sH !== 12) startMin += 720;
    if (sMod === 'AM' && sH === 12) startMin -= 720;

    const [eTime, eMod] = finalCheckOutTime.split(' ');
    const [eH, eM] = eTime.split(':').map(Number);
    let endMin = eH * 60 + eM;
    if (eMod === 'PM' && eH !== 12) endMin += 720;
    if (eMod === 'AM' && eH === 12) endMin -= 720;

    const totalMinutes = Math.max(0, endMin - startMin);
    const hours = Number((totalMinutes / 60).toFixed(2));
    const overtime = Math.max(0, hours - 8);

    record.checkOut = finalCheckOutTime;
    record.checkOutTime = finalCheckOutTime;
    record.checkOutGPS = checkOutGPS || (latitude && longitude ? `${latitude}, ${longitude}` : '');
    if (latitude !== undefined) record.latitude = latitude;
    if (longitude !== undefined) record.longitude = longitude;
    if (address !== undefined) record.address = address;
    record.workingHours = hours;
    record.overtime = Number(overtime.toFixed(2));
    record.currentStatus = 'Off Duty';
    record.tripsCompleted = tripsCompleted || record.tripsCompleted;
    record.distanceCovered = distanceCovered || record.distanceCovered;
    record.fuelUsed = fuelUsed || record.fuelUsed;

    let score = 100;
    if (record.attendanceStatus === 'Late') score -= 10;
    if (record.breakDuration && record.breakDuration > 60) score -= 5;
    record.performanceScore = score;

    record.timeline.push({
      time: finalCheckOutTime,
      event: 'End Duty',
      description: `Shift successfully terminated. Active Working hours: ${hours} hrs, Overtime: ${record.overtime} hrs.`,
      gps: checkOutGPS || (latitude && longitude ? `${latitude}, ${longitude}` : '')
    } as any);

    await record.save();
    emitTelemetryUpdate({ action: 'end-duty', driverId, record });
    res.json(record);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateAttendance = async (req: any, res: any) => {
  try {
    const updated = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteAttendance = async (req: any, res: any) => {
  try {
    await Attendance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Attendance log deleted.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
