import { useEffect, useRef, useState } from 'react';
import { useOperations } from '../store/OperationsContext';
import { api } from '../api/client';

// Haversine distance calculator in meters
const calculateDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const OFFLINE_QUEUE_KEY = 'smartops_offline_gps_queue';

interface DriverLocationState {
  latitude: number | null;
  longitude: number | null;
  speed: number;
  heading: number;
  accuracy: number;
  address: string;
  lastUpdated: Date | null;
  isTrackingActive: boolean;
  permissionStatus: 'granted' | 'prompt' | 'denied';
  isPermissionDenied: boolean;
}

export const useDriverLocationTracker = () => {
  const { user } = useOperations();
  const [state, setState] = useState<DriverLocationState>({
    latitude: null,
    longitude: null,
    speed: 0,
    heading: 0,
    accuracy: 0,
    address: '',
    lastUpdated: null,
    isTrackingActive: false,
    permissionStatus: 'prompt',
    isPermissionDenied: false
  });

  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<{ lat: number; lng: number; time: number } | null>(null);

  // Flush queued offline location updates when network comes back online
  const flushOfflineQueue = async () => {
    try {
      const rawQueue = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!rawQueue) return;
      const queue: any[] = JSON.parse(rawQueue);
      if (queue.length === 0) return;

      console.log(`[GPS Sync] Flushing ${queue.length} cached offline location updates to server...`);
      for (const payload of queue) {
        await api.driver.recordLocation(payload);
      }
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
    } catch (e) {
      console.warn('[GPS Sync] Failed to flush offline queue:', e);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      flushOfflineQueue();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Main Geolocation Watcher Lifecycle
  useEffect(() => {
    // Only run live location tracking if user is logged in as Driver
    if (!user || user.role !== 'Driver') {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setState(prev => ({ ...prev, isTrackingActive: false }));
      return;
    }

    if (!('geolocation' in navigator)) {
      setState(prev => ({
        ...prev,
        permissionStatus: 'denied',
        isPermissionDenied: true,
        isTrackingActive: false
      }));
      return;
    }

    // Check browser permission status if query API available
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' as any }).then(result => {
        if (result.state === 'denied') {
          setState(prev => ({ ...prev, permissionStatus: 'denied', isPermissionDenied: true }));
        }
        result.onchange = () => {
          if (result.state === 'denied') {
            setState(prev => ({ ...prev, permissionStatus: 'denied', isPermissionDenied: true, isTrackingActive: false }));
          } else if (result.state === 'granted') {
            setState(prev => ({ ...prev, permissionStatus: 'granted', isPermissionDenied: false }));
          }
        };
      }).catch(() => {});
    }

    const driverId = user.driverId || user.id;

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy || 10);
        const speed = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0; // m/s to km/h
        const heading = Math.round(pos.coords.heading || 0);
        const now = Date.now();

        // Check throttling: send if moved > 10m OR if 5s elapsed since last send
        let shouldSend = false;
        if (!lastSentRef.current) {
          shouldSend = true;
        } else {
          const dist = calculateDistanceMeters(lastSentRef.current.lat, lastSentRef.current.lng, lat, lng);
          const elapsed = now - lastSentRef.current.time;
          if (dist >= 10 || elapsed >= 5000) {
            shouldSend = true;
          }
        }

        let addressStr = state.address;
        if (shouldSend) {
          lastSentRef.current = { lat, lng, time: now };
          try {
            const geoRes = await api.maps.reverseGeocode(lat, lng);
            if (geoRes?.formattedAddress) {
              addressStr = geoRes.formattedAddress;
            }
          } catch {
            addressStr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          }

          const payload = {
            driverId,
            latitude: lat,
            longitude: lng,
            accuracy,
            speed,
            heading,
            address: addressStr,
            timestamp: new Date().toISOString()
          };

          if (navigator.onLine) {
            await api.driver.recordLocation(payload);
          } else {
            // Offline caching
            try {
              const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
              queue.push(payload);
              localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue.slice(-50))); // max 50 items
            } catch (qErr) {
              console.warn('[GPS Cache] Failed to cache location locally:', qErr);
            }
          }
        }

        setState({
          latitude: lat,
          longitude: lng,
          speed,
          heading,
          accuracy,
          address: addressStr,
          lastUpdated: new Date(),
          isTrackingActive: true,
          permissionStatus: 'granted',
          isPermissionDenied: false
        });
      },
      (err) => {
        console.warn('Geolocation watcher error:', err.message);
        if (err.code === err.PERMISSION_DENIED) {
          setState(prev => ({
            ...prev,
            permissionStatus: 'denied',
            isPermissionDenied: true,
            isTrackingActive: false
          }));
        } else {
          setState(prev => ({ ...prev, isTrackingActive: false }));
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [user]);

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState(prev => ({ ...prev, isTrackingActive: false }));
  };

  return {
    ...state,
    stopTracking
  };
};
