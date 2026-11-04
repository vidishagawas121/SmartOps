import { Request, Response } from 'express';
import {
  geocodeAddress,
  reverseGeocode,
  calculateDistanceAndETA,
  getDirectionsRoute
} from '../services/googleMapsService';

export const geocode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.query;
    if (!address || typeof address !== 'string') {
      res.status(400).json({ message: 'Address query parameter is required' });
      return;
    }

    const coords = await geocodeAddress(address);
    if (!coords) {
      res.status(444).json({ message: 'Address location not found' });
      return;
    }

    res.json(coords);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const reverseGeocodeController = async (req: Request, res: Response): Promise<void> => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ message: 'Valid lat and lng query parameters are required' });
      return;
    }

    const result = await reverseGeocode(lat, lng);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const distanceETAController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { origin, destination, speed } = req.query;
    if (!origin || !destination) {
      res.status(400).json({ message: 'Origin and destination parameters are required' });
      return;
    }

    const speedNum = speed ? parseFloat(speed as string) : 45;
    const result = await calculateDistanceAndETA(
      origin as string,
      destination as string,
      speedNum
    );

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const directionsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { origin, destination, waypoints } = req.query;
    if (!origin || !destination) {
      res.status(400).json({ message: 'Origin and destination parameters are required' });
      return;
    }

    const waypointsArray = typeof waypoints === 'string' ? waypoints.split('|') : undefined;
    const result = await getDirectionsRoute(
      origin as string,
      destination as string,
      waypointsArray
    );

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
