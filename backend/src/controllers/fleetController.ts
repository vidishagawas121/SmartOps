import { Response } from 'express';
import Vehicle from '../models/Vehicle';
import { AuthRequest } from '../middleware/authMiddleware';

// Helper: shape a Vehicle document into a consistent frontend-safe object
const shapeVehicle = (doc: any) => ({
  id: String(doc._id),
  _id: String(doc._id),
  vehicleNumber: doc.vehicleNumber,
  vehicleType: doc.vehicleType,
  driver: doc.driver,
  rcNumber: doc.rcNumber,
  insurance: doc.insurance,
  permit: doc.permit,
  fitness: doc.fitness,
  fuelType: doc.fuelType,
  mileage: doc.mileage,
  currentLocation: doc.currentLocation,
  status: doc.status || 'Idle',
  companyId: doc.companyId,
  ownerId: doc.ownerId,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

export const getVehicles = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.companyId;
    if (!companyId) {
      return res.status(403).json({ message: 'Access denied: Company context required.' });
    }
    const vehicles = await Vehicle.find({ companyId }).sort({ createdAt: -1 });
    res.json(vehicles.map(shapeVehicle));
  } catch (err: any) {
    console.error('[Fleet] getVehicles error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

export const createVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.companyId;
    if (!companyId) {
      return res.status(403).json({ message: 'Access denied: Company context required.' });
    }

    // Validate required fields
    const { vehicleNumber, vehicleType, driver, rcNumber, insurance, permit, fitness, fuelType, mileage, currentLocation } = req.body;
    if (!vehicleNumber || !String(vehicleNumber).trim()) {
      return res.status(422).json({ message: 'Vehicle number is required.' });
    }

    const vehicle = new Vehicle({
      vehicleNumber: String(vehicleNumber).trim(),
      vehicleType: vehicleType || 'Container Truck',
      driver: driver || '',
      rcNumber: rcNumber || '',
      insurance: insurance || '',
      permit: permit || '',
      fitness: fitness || '',
      fuelType: fuelType || 'Diesel',
      mileage: Number(mileage) || 0,
      currentLocation: currentLocation || '',
      status: req.body.status || 'Idle',
      companyId,
      ownerId: req.userId,
    });

    await vehicle.save();
    res.status(201).json(shapeVehicle(vehicle));
  } catch (err: any) {
    console.error('[Fleet] createVehicle error:', err.message);
    if (err.code === 11000) {
      return res.status(409).json({
        message: `Vehicle with number "${req.body.vehicleNumber}" is already registered.`
      });
    }
    res.status(400).json({ message: err.message });
  }
};

export const updateVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.companyId;
    if (!companyId) {
      return res.status(403).json({ message: 'Access denied: Company context required.' });
    }
    const updated = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, companyId },
      req.body,
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Vehicle not found.' });
    }
    res.json(shapeVehicle(updated));
  } catch (err: any) {
    console.error('[Fleet] updateVehicle error:', err.message);
    res.status(400).json({ message: err.message });
  }
};

export const deleteVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.companyId;
    if (!companyId) {
      return res.status(403).json({ message: 'Access denied: Company context required.' });
    }
    const deleted = await Vehicle.findOneAndDelete({ _id: req.params.id, companyId });
    if (!deleted) {
      return res.status(404).json({ message: 'Vehicle not found.' });
    }
    res.json({ message: 'Vehicle deleted successfully.' });
  } catch (err: any) {
    console.error('[Fleet] deleteVehicle error:', err.message);
    res.status(500).json({ message: err.message });
  }
};
