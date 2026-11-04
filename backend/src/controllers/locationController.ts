import { Request, Response } from 'express';
import Location from '../models/Location';
import LocationHistory from '../models/LocationHistory';
import Trip from '../models/Trip';
import User from '../models/User';
import TripEvent from '../models/TripEvent';
import { reverseGeocode, calculateDistanceAndETA } from '../services/googleMapsService';
import { emitTelemetryUpdate } from '../sockets/telemetrySocket';

/**
 * Record a new live GPS location update for a driver
 * POST /api/driver/location
 */
export const recordLocation = async (req: Request, res: Response) => {
  try {
    const {
      driverId,
      tripId,
      latitude,
      longitude,
      accuracy,
      speed,
      heading,
      battery,
      network,
      address,
      timestamp
    } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude coordinates are required.'
      });
    }

    const latNum = Number(latitude);
    const lngNum = Number(longitude);

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      return res.status(400).json({ success: false, message: 'Invalid latitude value.' });
    }

    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      return res.status(400).json({ success: false, message: 'Invalid longitude value.' });
    }

    // Determine target driver ID from auth token or request body
    const effectiveDriverId = driverId || (req as any).user?.driverId || (req as any).user?.id;

    // Find driver user record to get companyId and driver metadata
    const driverUser = await User.findOne({
      $or: [
        { driverId: effectiveDriverId },
        { _id: effectiveDriverId },
        { email: (req as any).user?.email }
      ]
    }).lean();

    const companyId = driverUser?.companyId || (req as any).user?.companyId;

    // Reverse geocode if readable address not provided
    let displayAddress = address || '';
    if (!displayAddress || displayAddress.includes('Coordinates:')) {
      try {
        const geoResult = await reverseGeocode(latNum, lngNum);
        displayAddress = geoResult.formattedAddress;
      } catch (gErr) {
        displayAddress = `${latNum.toFixed(4)}, ${lngNum.toFixed(4)}`;
      }
    }

    const currentSpeed = Number(speed) || 0;
    const currentHeading = Number(heading) || 0;
    const currentAccuracy = Number(accuracy) || 10;
    const currentBattery = Number(battery) || 95;
    const currentNetwork = network || '4G';
    const recordTime = timestamp ? new Date(timestamp) : new Date();

    // 1. Save to Location collection
    const locationRecord = new Location({
      driverId: effectiveDriverId || 'DRV-UNKNOWN',
      tripId: tripId || null,
      companyId,
      latitude: latNum,
      longitude: lngNum,
      accuracy: currentAccuracy,
      speed: currentSpeed,
      heading: currentHeading,
      battery: currentBattery,
      network: currentNetwork,
      address: displayAddress,
      createdAt: recordTime
    });

    await locationRecord.save();

    // 2. Find Active Trip for driver and update telemetry & ETA
    let activeTrip = null;
    if (tripId) {
      activeTrip = await Trip.findById(tripId);
    }
    if (!activeTrip && effectiveDriverId) {
      activeTrip = await Trip.findOne({
        $or: [{ driverId: effectiveDriverId }, { driverId: driverUser?.driverId }],
        status: { $nin: ['Completed', 'Cancelled'] }
      });
    }

    let calculatedETA = '30 Mins';
    let remainingDist = 15.0;

    if (activeTrip) {
      // Calculate ETA using Google Maps service
      try {
        const etaRes = await calculateDistanceAndETA(
          { lat: latNum, lng: lngNum },
          activeTrip.dropLocation,
          currentSpeed
        );
        calculatedETA = etaRes.durationText || etaRes.etaString || '25 Mins';
        remainingDist = etaRes.distanceRemainingKm || 12.5;
      } catch (etaErr) {
        // keep defaults
      }

      activeTrip.latitude = latNum;
      activeTrip.longitude = lngNum;
      activeTrip.currentLocation = displayAddress;
      activeTrip.currentAddress = displayAddress;
      activeTrip.speed = currentSpeed;
      activeTrip.heading = currentHeading;
      activeTrip.accuracy = currentAccuracy;
      activeTrip.lastGpsUpdate = recordTime;
      activeTrip.distanceRemaining = remainingDist;
      activeTrip.eta = calculatedETA;

      if (!activeTrip.locationHistory) activeTrip.locationHistory = [];
      activeTrip.locationHistory.push({
        lat: latNum,
        lng: lngNum,
        timestamp: recordTime,
        address: displayAddress,
        speed: currentSpeed,
        heading: currentHeading,
        accuracy: currentAccuracy
      });

      await activeTrip.save();

      // Save to LocationHistory collection
      await LocationHistory.create({
        tripId: activeTrip._id,
        driverId: effectiveDriverId,
        latitude: latNum,
        longitude: lngNum,
        accuracy: currentAccuracy,
        speed: currentSpeed,
        heading: currentHeading,
        address: displayAddress,
        timestamp: recordTime,
        serverReceivedAt: new Date()
      });

      // Save TripEvent
      await TripEvent.create({
        tripId: activeTrip._id,
        driverId: effectiveDriverId,
        companyId,
        eventType: 'location-update',
        title: 'Live Location Update',
        description: displayAddress,
        latitude: latNum,
        longitude: lngNum,
        address: displayAddress,
        timestamp: recordTime
      });
    }

    // 3. Update User document with latest GPS telemetry & location tracking fields
    if (driverUser) {
      await User.updateOne(
        { _id: driverUser._id },
        {
          $set: {
            isOnline: true,
            latitude: latNum,
            longitude: lngNum,
            address: displayAddress,
            currentLocation: displayAddress,
            speed: currentSpeed,
            heading: currentHeading,
            accuracy: currentAccuracy,
            lastUpdated: recordTime,
            lastGpsUpdate: recordTime,
            battery: currentBattery,
            network: currentNetwork,
            status: 'Online'
          }
        }
      );
    }

    // 4. Emit real-time telemetry update over Socket.IO
    const socketPayload = {
      action: 'driver-location-update',
      driverId: effectiveDriverId,
      driverName: driverUser?.fullName || 'Active Driver',
      companyId,
      tripId: activeTrip?._id || tripId,
      tripNumber: activeTrip?.tripNumber || '',
      isOnline: true,
      latitude: latNum,
      longitude: lngNum,
      speed: currentSpeed,
      heading: currentHeading,
      accuracy: currentAccuracy,
      battery: currentBattery,
      network: currentNetwork,
      address: displayAddress,
      eta: calculatedETA,
      distanceRemaining: remainingDist,
      lastUpdated: recordTime,
      timestamp: recordTime
    };

    emitTelemetryUpdate(socketPayload);

    return res.status(201).json({
      success: true,
      message: 'Location telemetry recorded successfully.',
      data: {
        location: locationRecord,
        address: displayAddress,
        eta: calculatedETA,
        distanceRemaining: remainingDist
      }
    });
  } catch (err: any) {
    console.error('Error recording location:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get latest location for a driver
 * GET /api/driver/location/:driverId
 */
export const getDriverLatestLocation = async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    const latest = await Location.findOne({ driverId }).sort({ createdAt: -1 });
    if (!latest) {
      return res.status(404).json({ success: false, message: 'No location history found for driver.' });
    }
    res.json({ success: true, data: latest });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get location history for a specific trip
 * GET /api/driver/location/trip/:tripId
 */
export const getTripLocationHistory = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const history = await Location.find({ tripId }).sort({ createdAt: 1 }).limit(500);
    res.json({ success: true, count: history.length, data: history });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
