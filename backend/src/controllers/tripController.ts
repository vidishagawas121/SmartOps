import mongoose from 'mongoose';
import { Response } from 'express';
import Trip from '../models/Trip';
import LocationHistory from '../models/LocationHistory';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import { emitTelemetryUpdate } from '../sockets/telemetrySocket';
import {
  reverseGeocode,
  calculateDistanceAndETA,
  geocodeAddress,
  calculateHaversineDistance
} from '../services/googleMapsService';

const GEOFENCE_RADIUS_METERS = parseInt(process.env.GEOFENCE_RADIUS_METERS || '100', 10);

/**
 * Helper to safely find a Trip document by _id, tripNumber, or custom id string
 * Prevents Mongoose CastError (HTTP 400) when non-ObjectId trip strings (e.g. TRP-527398) are supplied.
 */
const findTripDoc = async (idOrNumber: string) => {
  if (!idOrNumber) return null;
  if (mongoose.Types.ObjectId.isValid(idOrNumber)) {
    const doc = await Trip.findById(idOrNumber);
    if (doc) return doc;
  }
  return await Trip.findOne({
    $or: [
      { tripNumber: idOrNumber },
      { id: idOrNumber },
      { invoiceNumber: idOrNumber }
    ]
  });
};

/**
 * Helper to safely update a Trip document by _id, tripNumber, or custom id string
 */
const findAndUpdateTripDoc = async (idOrNumber: string, updateData: any) => {
  if (!idOrNumber) return null;
  if (mongoose.Types.ObjectId.isValid(idOrNumber)) {
    const updated = await Trip.findByIdAndUpdate(idOrNumber, updateData, { new: true });
    if (updated) return updated;
  }
  return await Trip.findOneAndUpdate(
    {
      $or: [
        { tripNumber: idOrNumber },
        { id: idOrNumber },
        { invoiceNumber: idOrNumber }
      ]
    },
    updateData,
    { new: true }
  );
};

export const getTrips = async (req: any, res: any): Promise<any> => {
  try {
    const userRole = req.userRole;
    const userId = req.userId;

    let filter: any = {};
    if (userRole === 'Driver') {
      const driverUser = await User.findById(userId);
      const driverIdVal = driverUser?.driverId || userId;
      filter = {
        $or: [
          { driverId: driverIdVal },
          { driverId: userId }
        ]
      };
    } else {
      const companyId = req.companyId;
      if (!companyId) {
        return res.status(403).json({ message: 'Access denied: Company context required.' });
      }
      filter.companyId = companyId;
    }

    const trips = await Trip.find(filter).sort({ createdAt: -1 });
    res.json(trips);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createTrip = async (req: any, res: any): Promise<any> => {
  try {
    const tripData = {
      ...req.body,
      companyId: req.companyId,
      ownerId: req.userId
    };

    // Auto-assign vehicle if missing
    if (!tripData.vehicleNumber) {
      tripData.vehicleNumber = `MH-12-TRK-${Math.floor(Math.random() * 900) + 100}`;
    }

    // 2. Check driver availability
    if (tripData.driverId) {
      const activeDriverTrip = await Trip.findOne({
        driverId: tripData.driverId,
        status: { $nin: ['Completed', 'Cancelled'] }
      });
      if (activeDriverTrip) {
        res.status(400).json({
          message: `Driver ID ${tripData.driverId} is currently handling another active trip ${activeDriverTrip.tripNumber}.`
        });
        return;
      }
    }

    // 3. Auto-generate Trip Number if missing
    if (!tripData.tripNumber) {
      tripData.tripNumber = `TRP-${Date.now().toString().slice(-6)}`;
    }

    // 4. Auto-geocode pickup and dropoff locations if coordinates not provided
    if (tripData.pickupLocation && !tripData.pickupCoordinates) {
      const pCoords = await geocodeAddress(tripData.pickupLocation);
      if (pCoords) tripData.pickupCoordinates = pCoords;
    }
    if (tripData.dropLocation && !tripData.dropCoordinates) {
      const dCoords = await geocodeAddress(tripData.dropLocation);
      if (dCoords) tripData.dropCoordinates = dCoords;
    }

    // Helper to sanitize dates
    const safeDateParse = (val: any) => {
      if (!val) return new Date();
      if (val instanceof Date && !isNaN(val.getTime())) return val;
      const str = String(val).trim();
      const match12 = str.match(/(\d{4}-\d{2}-\d{2})[T\s]+(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (match12) {
        let hours = parseInt(match12[2], 10);
        const minutes = parseInt(match12[3], 10);
        const modifier = match12[4] ? match12[4].toUpperCase() : null;
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        const hh = hours.toString().padStart(2, '0');
        const mm = minutes.toString().padStart(2, '0');
        const candidate = `${match12[1]}T${hh}:${mm}:00.000Z`;
        const parsed = new Date(candidate);
        if (!isNaN(parsed.getTime())) return parsed;
      }
      const parsedFallback = new Date(str);
      return !isNaN(parsedFallback.getTime()) ? parsedFallback : new Date();
    };

    if (tripData.scheduledStart) {
      tripData.scheduledStart = safeDateParse(tripData.scheduledStart);
    } else {
      tripData.scheduledStart = new Date();
    }

    if (tripData.expectedEnd) {
      tripData.expectedEnd = safeDateParse(tripData.expectedEnd);
    } else {
      tripData.expectedEnd = new Date(Date.now() + 4 * 3600 * 1000);
    }

    const trip = new Trip(tripData);
    await trip.save();
    emitTelemetryUpdate({ tripId: trip._id.toString(), type: 'TRIP_CREATED', trip });

    res.status(201).json(trip);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getActiveTrip = async (req: any, res: any): Promise<any> => {
  try {
    const userRole = (req as any).user?.role;
    const userDriverId = (req as any).user?.driverId || (req as any).user?.id;

    let filter: any = { status: { $nin: ['Completed', 'Cancelled'] } };
    if (userRole === 'Driver') {
      filter.$or = [
        { driverId: userDriverId },
        { driverId: (req as any).user?.id },
        { driverId: 'd1' },
        { driverId: 'DRV-9041' }
      ];
    }

    const activeTrip = await Trip.findOne(filter).sort({ updatedAt: -1 });
    if (!activeTrip) {
      res.status(404).json({ message: 'No active trip assignment found.' });
      return;
    }
    res.json(activeTrip);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getTripById = async (req: any, res: any): Promise<any> => {
  try {
    const trip = await findTripDoc(req.params.id);
    if (!trip) {
      res.status(404).json({ message: 'Trip not found.' });
      return;
    }

    const userRole = (req as any).user?.role;
    const userDriverId = (req as any).user?.driverId || (req as any).user?.id;
    if (userRole === 'Driver' && trip.driverId !== userDriverId && trip.driverId !== 'd1' && trip.driverId !== 'DRV-9041') {
      res.status(403).json({ message: 'Unauthorized: Access to this trip assignment is restricted.' });
      return;
    }

    res.json(trip);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const assignTrip = async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    const { driverId, driverName, vehicleNumber } = req.body;

    const trip = await findTripDoc(id);
    if (!trip) {
      res.status(404).json({ message: 'Trip not found.' });
      return;
    }

    if (trip.status === 'Completed' || trip.status === 'Cancelled') {
      res.status(400).json({ message: `Cannot re-assign a ${trip.status} trip.` });
      return;
    }

    trip.driverId = driverId || trip.driverId;
    trip.driverName = driverName || trip.driverName;
    trip.vehicleNumber = vehicleNumber || trip.vehicleNumber;
    trip.status = 'Assigned';

    await trip.save();
    emitTelemetryUpdate({ tripId: trip._id.toString(), type: 'TRIP_ASSIGNED', trip });

    res.json(trip);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const acceptTrip = async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    const trip = await findTripDoc(id);
    if (!trip) {
      res.status(404).json({ message: 'Trip not found.' });
      return;
    }

    trip.status = 'Accepted';
    await trip.save();
    emitTelemetryUpdate({ tripId: trip._id.toString(), type: 'TRIP_ACCEPTED', trip });

    res.json(trip);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const startTrip = async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.body.id ? req.body : req.params;
    const tripId = id || req.params.id;

    const trip = await findTripDoc(tripId);
    if (!trip) {
      res.status(404).json({ message: 'Trip not found.' });
      return;
    }

    trip.status = 'In Transit';
    trip.startedAt = new Date();
    await trip.save();

    emitTelemetryUpdate({ tripId: trip._id.toString(), type: 'TRIP_STARTED', trip });
    res.json(trip);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const updateLocation = async (req: any, res: any): Promise<any> => {
  try {
    const { id, latitude, longitude, accuracy, speed, heading, distanceRemaining, eta, timestamp } = req.body;
    const tripId = id || req.params.id;

    const existingTrip = await findTripDoc(tripId);
    if (!existingTrip) {
      res.status(404).json({ message: 'Trip not found.' });
      return;
    }

    // Driver authorization check
    const authReq = req as any;
    const requestingUserId = authReq.userId;
    const requestingRole = authReq.userRole;

    if (requestingRole === 'Driver') {
      const requestingUser = await User.findById(requestingUserId);
      const isAssigned = existingTrip.driverId === requestingUserId || 
                         (requestingUser && requestingUser.driverId === existingTrip.driverId);
      if (!isAssigned) {
        res.status(403).json({ message: 'Unauthorized. You can only transmit location for your assigned trip.' });
        return;
      }
    }

    if (existingTrip.status === 'Completed' || existingTrip.status === 'Cancelled') {
      res.status(400).json({ message: `Cannot update location for a ${existingTrip.status} trip.` });
      return;
    }

    const latNum = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
    const lngNum = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
    const speedNum = typeof speed === 'string' ? parseFloat(speed) : (speed || 0);
    const headingNum = typeof heading === 'string' ? parseFloat(heading) : (heading || 0);
    const accuracyNum = typeof accuracy === 'string' ? parseFloat(accuracy) : (accuracy !== undefined ? parseFloat(accuracy) : 10);

    if (isNaN(latNum) || isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      res.status(400).json({ message: 'Invalid latitude or longitude coordinates provided.' });
      return;
    }

    if (accuracyNum !== undefined && (isNaN(accuracyNum) || accuracyNum < 0)) {
      res.status(400).json({ message: 'Invalid GPS accuracy value provided.' });
      return;
    }

    const now = new Date();
    let reverseGeoAddress = existingTrip.currentAddress || '';

    // 1. Google Maps Reverse Geocoding
    const geoResult = await reverseGeocode(latNum, lngNum);
    reverseGeoAddress = geoResult.formattedAddress;

    // 2. Google Maps Distance & ETA calculation to drop location
    let calcDistance = distanceRemaining || existingTrip.distanceRemaining;
    let calcEta = eta || existingTrip.eta;
    if (existingTrip.dropLocation) {
      const etaCalc = await calculateDistanceAndETA(
        { lat: latNum, lng: lngNum },
        existingTrip.dropLocation,
        speedNum || 45
      );
      calcDistance = etaCalc.distanceRemainingKm;
      calcEta = etaCalc.etaString;
    }

    // 3. Save telemetry location to indexed LocationHistory collection
    const locDoc = new LocationHistory({
      tripId: existingTrip._id.toString(),
      driverId: existingTrip.driverId,
      vehicleId: existingTrip.vehicleId || existingTrip.vehicleNumber,
      latitude: latNum,
      longitude: lngNum,
      accuracy: accuracyNum,
      speed: speedNum,
      heading: headingNum,
      address: reverseGeoAddress,
      timestamp: timestamp ? new Date(timestamp) : now,
      serverReceivedAt: now
    });
    await locDoc.save();

    // 4. Update Trip document fields
    existingTrip.latitude = latNum;
    existingTrip.longitude = lngNum;
    existingTrip.accuracy = accuracyNum;
    existingTrip.speed = speedNum;
    existingTrip.heading = headingNum;
    existingTrip.currentLocation = `${latNum}, ${lngNum}`;
    existingTrip.currentAddress = reverseGeoAddress;
    existingTrip.lastGpsUpdate = now;
    existingTrip.distanceRemaining = calcDistance;
    existingTrip.eta = calcEta;

    // Append to locationHistory array (keep last 100 breadcrumbs)
    if (!existingTrip.locationHistory) {
      existingTrip.locationHistory = [];
    }
    existingTrip.locationHistory.push({
      lat: latNum,
      lng: lngNum,
      timestamp: now,
      address: reverseGeoAddress,
      speed: speedNum,
      heading: headingNum,
      accuracy: accuracyNum
    });
    if (existingTrip.locationHistory.length > 100) {
      existingTrip.locationHistory = existingTrip.locationHistory.slice(-100);
    }

    await existingTrip.save();

    const socketPayload = {
      tripId: existingTrip._id.toString(),
      vehicleNumber: existingTrip.vehicleNumber,
      driverId: existingTrip.driverId,
      latitude: latNum,
      longitude: lngNum,
      accuracy: accuracyNum,
      currentLocation: existingTrip.currentLocation,
      currentAddress: existingTrip.currentAddress,
      speed: speedNum,
      heading: headingNum,
      lastGpsUpdate: now,
      distanceRemaining: existingTrip.distanceRemaining,
      eta: existingTrip.eta,
      status: existingTrip.status,
      timestamp: now
    };

    // Broadcast real-time telemetry update over WebSocket connections
    emitTelemetryUpdate(socketPayload);

    res.json({
      success: true,
      data: {
        tripId: existingTrip._id.toString(),
        location: {
          latitude: latNum,
          longitude: lngNum,
          accuracy: accuracyNum,
          speed: speedNum,
          heading: headingNum,
          address: reverseGeoAddress,
          timestamp: now
        },
        trip: existingTrip
      }
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const arriveStop = async (req: any, res: any): Promise<any> => {
  try {
    const { id, stopId } = req.params;
    const { latitude, longitude } = req.body;

    const trip = await findTripDoc(id);
    if (!trip) {
      res.status(404).json({ message: 'Trip not found.' });
      return;
    }

    const stop = trip.stops.find(s => s._id?.toString() === stopId || (s as any).id === stopId || s.sequence.toString() === stopId);
    if (!stop) {
      res.status(404).json({ message: 'Specified stop sequence not found on this trip.' });
      return;
    }

    // Geofence Radius Validation
    if (latitude && longitude && stop.latitude && stop.longitude) {
      const distanceKm = calculateHaversineDistance(latitude, longitude, stop.latitude, stop.longitude);
      const distanceMeters = distanceKm * 1000;

      if (distanceMeters > GEOFENCE_RADIUS_METERS) {
        res.status(400).json({
          message: `You are outside the delivery location (${Math.round(distanceMeters)}m away). Move closer to destination (${GEOFENCE_RADIUS_METERS}m radius) before confirming arrival.`
        });
        return;
      }
    }

    stop.status = 'Arrived';
    stop.arrivedAt = new Date();
    trip.status = 'At Stop';

    await trip.save();
    emitTelemetryUpdate({ tripId: trip._id.toString(), type: 'STOP_ARRIVED', stopId, trip });

    res.json(trip);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const completeStop = async (req: any, res: any): Promise<any> => {
  try {
    const { id, stopId } = req.params;
    const { podId, stopReason, notes } = req.body;

    const trip = await findTripDoc(id);
    if (!trip) {
      res.status(404).json({ message: 'Trip not found.' });
      return;
    }

    const stop = trip.stops.find(s => s._id?.toString() === stopId || (s as any).id === stopId || s.sequence.toString() === stopId);
    if (!stop) {
      res.status(404).json({ message: 'Specified stop sequence not found on this trip.' });
      return;
    }

    stop.status = 'Completed';
    stop.completedAt = new Date();
    if (podId) stop.podId = podId;
    if (stopReason) stop.stopReason = stopReason;
    if (notes) stop.notes = notes;

    // Check if all stops completed
    const allStopsCompleted = trip.stops.every(s => s.status === 'Completed' || s.status === 'Skipped');
    if (allStopsCompleted) {
      trip.status = 'Delivered';
    }

    await trip.save();
    emitTelemetryUpdate({ tripId: trip._id.toString(), type: 'STOP_COMPLETED', stopId, trip });

    res.json(trip);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const reportDelay = async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    const { reason, note } = req.body;

    const trip = await findTripDoc(id);
    if (!trip) {
      res.status(404).json({ message: 'Trip not found.' });
      return;
    }

    trip.status = 'Delayed';
    trip.stopReason = reason || note || 'Traffic Delay';
    await trip.save();

    emitTelemetryUpdate({ tripId: trip._id.toString(), type: 'TRIP_DELAYED', reason, note, trip });
    res.json(trip);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const reportIncident = async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    const { incidentType, description } = req.body;

    const trip = await findTripDoc(id);
    if (!trip) {
      res.status(404).json({ message: 'Trip not found.' });
      return;
    }

    trip.status = 'Incident Reported';
    trip.stopReason = `[INCIDENT] ${incidentType}: ${description}`;
    await trip.save();

    emitTelemetryUpdate({ tripId: trip._id.toString(), type: 'INCIDENT_REPORTED', incidentType, description, trip });
    res.json(trip);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getTripLiveTracking = async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    const trip = await findTripDoc(id);
    if (!trip) {
      res.status(404).json({ message: 'Trip not found.' });
      return;
    }

    let pickupCoords = trip.pickupCoordinates;
    let dropCoords = trip.dropCoordinates;

    if (!pickupCoords || !pickupCoords.lat) {
      const p = await geocodeAddress(trip.pickupLocation);
      if (p) pickupCoords = p;
    }
    if (!dropCoords || !dropCoords.lat) {
      const d = await geocodeAddress(trip.dropLocation);
      if (d) dropCoords = d;
    }

    const googleNavUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(trip.currentLocation || trip.pickupLocation)}&destination=${encodeURIComponent(trip.dropLocation)}&travelmode=driving`;

    // Calculate GPS Freshness
    const lastGps = trip.lastGpsUpdate ? new Date(trip.lastGpsUpdate).getTime() : 0;
    const now = Date.now();
    const diffMins = lastGps ? Math.floor((now - lastGps) / 60000) : 999;

    let gpsFreshnessStatus: 'LIVE' | 'STALE' | 'OFFLINE' = 'OFFLINE';
    if (diffMins < 2) gpsFreshnessStatus = 'LIVE';
    else if (diffMins < 5) gpsFreshnessStatus = 'STALE';

    res.json({
      tripId: trip._id,
      tripNumber: trip.tripNumber,
      driverName: trip.driverName,
      driverId: trip.driverId,
      vehicleNumber: trip.vehicleNumber,
      status: trip.status,
      currentLocation: trip.currentLocation,
      currentAddress: trip.currentAddress || trip.pickupLocation,
      latitude: trip.latitude || pickupCoords?.lat || 18.5204,
      longitude: trip.longitude || pickupCoords?.lng || 73.8567,
      accuracy: trip.accuracy || 10,
      speed: trip.speed || 0,
      heading: trip.heading || 0,
      lastGpsUpdate: trip.lastGpsUpdate,
      gpsFreshnessStatus,
      gpsFreshnessMinutesAgo: diffMins,
      distanceRemaining: trip.distanceRemaining,
      eta: trip.eta,
      pickupLocation: trip.pickupLocation,
      pickupCoordinates: pickupCoords || { lat: 18.5204, lng: 73.8567 },
      dropLocation: trip.dropLocation,
      dropCoordinates: dropCoords || { lat: 18.7602, lng: 73.8612 },
      stops: trip.stops || [],
      locationHistory: trip.locationHistory || [],
      googleNavUrl
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getLocationHistory = async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    const { driverId, startDate, endDate } = req.query;

    const query: any = { tripId: id };

    if (driverId) {
      query.driverId = String(driverId);
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(String(startDate));
      if (endDate) query.timestamp.$lte = new Date(String(endDate));
    }

    const history = await LocationHistory.find(query).sort({ timestamp: -1 }).limit(500);
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const completeTrip = async (req: any, res: any): Promise<any> => {
  try {
    const { id, signatureData, photo } = req.body;
    const tripId = id || req.params.id;
    const updated = await findAndUpdateTripDoc(
      tripId,
      {
        status: 'Completed',
        completedAt: new Date(),
        ...(signatureData ? { signatureData } : {}),
        ...(photo ? { photo } : {})
      }
    );
    if (!updated) {
      res.status(404).json({ message: 'Trip not found.' });
      return;
    }
    emitTelemetryUpdate({ tripId: updated._id.toString(), type: 'TRIP_COMPLETED', trip: updated });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const updateTrip = async (req: any, res: any): Promise<any> => {
  try {
    const idParam = req.params.id;
    const updated = await findAndUpdateTripDoc(idParam, req.body);
    if (!updated) {
      res.status(404).json({ message: `Trip not found.` });
      return;
    }
    emitTelemetryUpdate({ tripId: updated._id.toString(), update: req.body });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const cancelTrip = async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    const trip = await findTripDoc(id);
    if (!trip) {
      res.status(404).json({ message: 'Trip not found.' });
      return;
    }

    if (trip.status === 'Completed') {
      res.status(400).json({ message: 'Cannot cancel a completed trip.' });
      return;
    }

    trip.status = 'Cancelled';
    await trip.save();

    emitTelemetryUpdate({ tripId: trip._id.toString(), type: 'TRIP_CANCELLED', trip });
    res.json(trip);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
