import { Request, Response } from 'express';
import Inventory from '../models/Inventory';
import Vehicle from '../models/Vehicle';
import Trip from '../models/Trip';
import User from '../models/User';
import Attendance from '../models/Attendance';
import Salary from '../models/Salary';

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const userCompanyId = (req as any).user?.companyId || (req as any).companyId;
    if (!userCompanyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Company context required for dashboard summary.'
      });
    }

    const query = { companyId: userCompanyId };

    const [
      inventoryItems,
      vehicles,
      trips,
      drivers,
      attendanceRecords,
      salaries
    ] = await Promise.all([
      Inventory.find(query),
      Vehicle.find(query),
      Trip.find(query),
      User.find({ ...query, role: 'Driver' }),
      Attendance.find(query),
      Salary.find(query)
    ]);

    const totalStockValuation = inventoryItems.reduce((acc, curr) => acc + ((curr.quantity || 0) * (curr.sellingPrice || 0)), 0);
    const lowStockCount = inventoryItems.filter(i => (i.quantity || 0) <= (i.minimumQuantity || 0) && (i.quantity || 0) > 0).length;
    const outOfStockCount = inventoryItems.filter(i => (i.quantity || 0) === 0).length;

    const movingVehicles = vehicles.filter(v => v.status === 'Moving').length;
    const idleVehicles = vehicles.filter(v => v.status === 'Idle').length;

    const inTransitTrips = trips.filter(t => t.status === 'In Transit' || t.status === 'Started').length;
    const completedTrips = trips.filter(t => t.status === 'Completed').length;

    const activeDrivers = drivers.filter(d => d.isOnline || d.status === 'Active' || d.status === 'Online').length;

    res.json({
      success: true,
      summary: {
        totalInventoryItems: inventoryItems.length,
        totalStockValuation,
        lowStockCount,
        outOfStockCount,
        totalVehicles: vehicles.length,
        movingVehicles,
        idleVehicles,
        totalTrips: trips.length,
        inTransitTrips,
        completedTrips,
        totalDrivers: drivers.length,
        activeDrivers,
        totalAttendanceToday: attendanceRecords.length,
        totalPayrollRecords: salaries.length
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
