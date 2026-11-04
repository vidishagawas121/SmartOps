import dotenv from 'dotenv';
dotenv.config();

export interface LocationCoords {
  lat: number;
  lng: number;
}

export interface DistanceETAResult {
  distanceRemainingKm: number;
  distanceText: string;
  durationText: string;
  durationSeconds: number;
  etaString: string;
}

export interface ReverseGeocodeResult {
  formattedAddress: string;
  city?: string;
  state?: string;
  country?: string;
}

// Haversine formula fallback for distance between two (lat, lng) points in KM
export const calculateHaversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// Fallback ETA calculation based on average city/highway speed (40 km/h)
export const calculateFallbackETA = (
  distanceKm: number,
  averageSpeedKmH: number = 40
): DistanceETAResult => {
  const durationHours = distanceKm / Math.max(averageSpeedKmH, 10);
  const durationSeconds = Math.round(durationHours * 3600);
  const minutes = Math.round((durationSeconds % 3600) / 60);
  const hours = Math.floor(durationHours);

  let durationText = '';
  if (hours > 0) {
    durationText = `${hours} hr ${minutes} mins`;
  } else {
    durationText = `${minutes} mins`;
  }

  const arrivalTime = new Date(Date.now() + durationSeconds * 1000);
  const timeString = arrivalTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const etaString = `${timeString} (${durationText})`;

  return {
    distanceRemainingKm: distanceKm,
    distanceText: `${distanceKm} km`,
    durationText,
    durationSeconds,
    etaString
  };
};

/**
 * Reverse Geocode: Converts lat, lng into human-readable street address via Google Maps Geocoding API
 */
export const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult> => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (apiKey && apiKey !== 'your_google_maps_api_key_here') {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const topResult = data.results[0];
        let city = '';
        let state = '';
        let country = '';

        for (const comp of topResult.address_components) {
          if (comp.types.includes('locality')) city = comp.long_name;
          if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
          if (comp.types.includes('country')) country = comp.long_name;
        }

        return {
          formattedAddress: topResult.formatted_address,
          city,
          state,
          country
        };
      }
    } catch (err: any) {
      console.warn('Google Maps Geocoding API request failed, using coordinate fallback:', err.message);
    }
  }

  // Fallback address string if API key not available or request failed
  return {
    formattedAddress: `Coordinates: (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    city: 'Logistics Transit Route'
  };
};

/**
 * Geocode Address: Converts address string to { lat, lng } via Google Maps Geocoding API
 */
export const geocodeAddress = async (
  address: string
): Promise<LocationCoords | null> => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (apiKey && apiKey !== 'your_google_maps_api_key_here') {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const loc = data.results[0].geometry.location;
        return { lat: loc.lat, lng: loc.lng };
      }
    } catch (err: any) {
      console.warn('Google Maps Geocoding API address lookup failed:', err.message);
    }
  }

  // Common Pune / Maharashtra default coordinates mapping for test cities if offline
  const knownLocations: Record<string, LocationCoords> = {
    'pune': { lat: 18.5204, lng: 73.8567 },
    'chakan': { lat: 18.7602, lng: 73.8612 },
    'bhiwandi': { lat: 19.2968, lng: 73.0631 },
    'mumbai': { lat: 19.0760, lng: 72.8777 },
    'vashi': { lat: 19.0770, lng: 73.0033 }
  };

  const lowerAddr = address.toLowerCase();
  for (const key of Object.keys(knownLocations)) {
    if (lowerAddr.includes(key)) {
      return knownLocations[key];
    }
  }

  return null;
};

/**
 * Calculate Distance & ETA using Google Distance Matrix API
 */
export const calculateDistanceAndETA = async (
  origin: LocationCoords | string,
  destination: LocationCoords | string,
  currentSpeedKmH?: number
): Promise<DistanceETAResult> => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  const originStr = typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`;
  const destStr = typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`;

  if (apiKey && apiKey !== 'your_google_maps_api_key_here') {
    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(originStr)}&destinations=${encodeURIComponent(destStr)}&mode=driving&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (
        data.status === 'OK' &&
        data.rows &&
        data.rows[0] &&
        data.rows[0].elements &&
        data.rows[0].elements[0].status === 'OK'
      ) {
        const element = data.rows[0].elements[0];
        const distanceValueMeters = element.distance.value;
        const durationValueSeconds = element.duration.value;
        const distanceKm = Math.round((distanceValueMeters / 1000) * 10) / 10;
        const durationText = element.duration.text;
        const distanceText = element.distance.text;

        const arrivalTime = new Date(Date.now() + durationValueSeconds * 1000);
        const timeString = arrivalTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        const etaString = `${timeString} (${durationText})`;

        return {
          distanceRemainingKm: distanceKm,
          distanceText,
          durationText,
          durationSeconds: durationValueSeconds,
          etaString
        };
      }
    } catch (err: any) {
      console.warn('Google Maps Distance Matrix API failed, switching to Haversine fallback:', err.message);
    }
  }

  // Parse numeric coordinates for Haversine fallback
  let oCoords: LocationCoords = { lat: 18.5204, lng: 73.8567 };
  let dCoords: LocationCoords = { lat: 18.7602, lng: 73.8612 };

  if (typeof origin === 'object') {
    oCoords = origin;
  } else if (origin.includes(',')) {
    const parts = origin.split(',').map(n => parseFloat(n.trim()));
    if (!isNaN(parts[0]) && !isNaN(parts[1])) oCoords = { lat: parts[0], lng: parts[1] };
  }

  if (typeof destination === 'object') {
    dCoords = destination;
  } else if (destination.includes(',')) {
    const parts = destination.split(',').map(n => parseFloat(n.trim()));
    if (!isNaN(parts[0]) && !isNaN(parts[1])) dCoords = { lat: parts[0], lng: parts[1] };
  }

  const distanceKm = calculateHaversineDistance(oCoords.lat, oCoords.lng, dCoords.lat, dCoords.lng);
  return calculateFallbackETA(distanceKm, currentSpeedKmH);
};

/**
 * Fetch Driving Directions route path via Google Maps Directions API
 */
export const getDirectionsRoute = async (
  origin: string,
  destination: string,
  waypoints?: string[]
): Promise<any> => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (apiKey && apiKey !== 'your_google_maps_api_key_here') {
    try {
      let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=driving&key=${apiKey}`;
      if (waypoints && waypoints.length > 0) {
        url += `&waypoints=${encodeURIComponent(waypoints.join('|'))}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (err: any) {
      console.warn('Google Maps Directions API request failed:', err.message);
    }
  }

  return { status: 'ZERO_RESULTS', routes: [] };
};

