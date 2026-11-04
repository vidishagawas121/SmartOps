import React, { useEffect, useRef, useState } from 'react';
import {
  Navigation,
  MapPin,
  Truck,
  Compass,
  Clock,
  ExternalLink,
  LocateFixed,
  Layers,
  Maximize2,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  Info,
  Map as MapIcon
} from 'lucide-react';

export interface MapLocation {
  lat: number;
  lng: number;
  address?: string;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp?: Date | string;
}

interface GoogleDriverMapProps {
  driverLocation?: MapLocation;
  pickupLocation?: MapLocation;
  dropLocation?: MapLocation;
  locationHistory?: MapLocation[];
  driverName?: string;
  vehicleNumber?: string;
  tripNumber?: string;
  eta?: string;
  distanceRemaining?: number;
  status?: string;
  height?: string;
  showControls?: boolean;
}

declare global {
  interface Window {
    google?: any;
    L?: any;
  }
}

export const GoogleDriverMap: React.FC<GoogleDriverMapProps> = ({
  driverLocation = { lat: 18.5204, lng: 73.8567, speed: 0, heading: 0 },
  pickupLocation,
  dropLocation,
  driverName = 'Driver Operator',
  vehicleNumber = 'MH-12-QW-9874',
  tripNumber = 'TRP-ACTIVE',
  eta = 'Calculated live',
  distanceRemaining = 0,
  status = 'In Transit',
  height = '480px',
  showControls = true
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mapEngine, setMapEngine] = useState<'google_embed' | 'interactive'>('google_embed');
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'dark'>('roadmap');

  // Reverse Geocoded Addresses
  const [driverAddress, setDriverAddress] = useState<string>(driverLocation?.address || '');
  const [dropAddress, setDropAddress] = useState<string>(dropLocation?.address || '');

  // Leaflet map instance references
  const leafletMapRef = useRef<any>(null);
  const leafletDriverMarkerRef = useRef<any>(null);
  const leafletRoutePolylineRef = useRef<any>(null);
  const leafletTileLayerRef = useRef<any>(null);

  // Google Maps instance references
  const googleMapRef = useRef<any>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const isGoogleKeyConfigured = Boolean(apiKey && apiKey.trim() !== '' && !apiKey.includes('your_google'));

  const lat = driverLocation?.lat || 18.5204;
  const lng = driverLocation?.lng || 73.8567;
  const speed = driverLocation?.speed || 0;
  const heading = driverLocation?.heading || 0;

  // ── 1. Dynamic Reverse Geocoding for Driver & Destination ────────────────────
  useEffect(() => {
    let isMounted = true;

    // Driver location address
    if (lat && lng) {
      if (driverLocation.address && driverLocation.address.trim() !== '' && !driverLocation.address.includes('Capturing')) {
        setDriverAddress(driverLocation.address);
      } else {
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
          headers: { 'User-Agent': 'SmartOpsLogisticsApp/1.0' }
        })
          .then(res => res.json())
          .then(data => {
            if (isMounted && data?.display_name) {
              setDriverAddress(data.display_name);
            }
          })
          .catch(() => {
            if (isMounted) setDriverAddress(`${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`);
          });
      }
    }

    // Destination address
    if (dropLocation?.lat && dropLocation?.lng) {
      if (dropLocation.address && dropLocation.address.trim() !== '') {
        setDropAddress(dropLocation.address);
      } else {
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${dropLocation.lat}&lon=${dropLocation.lng}&format=json`, {
          headers: { 'User-Agent': 'SmartOpsLogisticsApp/1.0' }
        })
          .then(res => res.json())
          .then(data => {
            if (isMounted && data?.display_name) {
              setDropAddress(data.display_name);
            }
          })
          .catch(() => {
            if (isMounted) setDropAddress(`${dropLocation.lat.toFixed(5)}° N, ${dropLocation.lng.toFixed(5)}° E`);
          });
      }
    }

    return () => {
      isMounted = false;
    };
  }, [lat, lng, driverLocation?.address, dropLocation?.lat, dropLocation?.lng, dropLocation?.address]);

  // ── 2. Load Leaflet JS & CSS dynamically for interactive map engine ─────────────
  useEffect(() => {
    if (window.L) return;

    const cssId = 'leaflet-css-sdk';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const scriptId = 'leaflet-js-sdk';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  // ── 3. Initialize Leaflet Map when switching to Interactive view ───────────────
  useEffect(() => {
    if (mapEngine !== 'interactive' || !containerRef.current || !(window as any).L) return;

    const L = (window as any).L;

    try {
      if (!leafletMapRef.current) {
        const map = L.map(containerRef.current, {
          center: [lat, lng],
          zoom: 15,
          zoomControl: false,
          attributionControl: false
        });

        leafletMapRef.current = map;

        const tileUrl = mapType === 'satellite'
          ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          : mapType === 'dark'
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

        const tileLayer = L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);
        leafletTileLayerRef.current = tileLayer;

        // Custom Driver Vehicle Marker Pin
        const driverIcon = L.divIcon({
          className: 'custom-driver-leaflet-pin',
          html: `
            <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.4));">
              <div style="background: #006A6A; color: white; padding: 3px 8px; border-radius: 6px; font-weight: 800; font-size: 11px; font-family: monospace; border: 1px solid #14B8A6; white-space: nowrap; margin-bottom: 2px;">
                ${vehicleNumber}
              </div>
              <div style="width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #006A6A, #10B981); border: 2px solid white; display: flex; align-items: center; justify-content: center; transform: rotate(${heading}deg); transition: transform 0.4s ease;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              </div>
            </div>
          `,
          iconSize: [42, 60],
          iconAnchor: [21, 52]
        });

        const dMarker = L.marker([lat, lng], { icon: driverIcon }).addTo(map);
        dMarker.bindPopup(`
          <div style="font-family: system-ui, sans-serif; padding: 4px; color: #0b1c30;">
            <div style="font-weight: 800; font-size: 13px;">🚚 ${driverName}</div>
            <div style="font-size: 11px; color: #006A6A; font-weight: 700; margin-top: 2px;">Vehicle: ${vehicleNumber}</div>
            <div style="font-size: 11px; color: #475569; margin-top: 4px;">📍 ${driverAddress || 'Current GPS Position'}</div>
            <div style="font-size: 10px; font-weight: 700; color: #10B981; margin-top: 4px;">⚡ Speed: ${Math.round(speed)} km/h</div>
          </div>
        `);
        leafletDriverMarkerRef.current = dMarker;

        // Destination Marker & Route Polyline
        if (dropLocation?.lat && dropLocation?.lng) {
          const dropIcon = L.divIcon({
            className: 'custom-drop-leaflet-pin',
            html: `
              <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));">
                <div style="background: #EF4444; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 10px; border: 1px solid white; white-space: nowrap; margin-bottom: 2px;">
                  Destination
                </div>
                <div style="width: 28px; height: 28px; border-radius: 50%; background: #EF4444; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
              </div>
            `,
            iconSize: [30, 45],
            iconAnchor: [15, 42]
          });

          const dropMarker = L.marker([dropLocation.lat, dropLocation.lng], { icon: dropIcon }).addTo(map);
          dropMarker.bindPopup(`<b>Destination:</b> ${dropAddress || dropLocation.address || 'Drop Point'}`);

          // OSRM Driving Route Line
          fetch(`https://router.project-osrm.org/route/v1/driving/${lng},${lat};${dropLocation.lng},${dropLocation.lat}?overview=full&geometries=geojson`)
            .then(res => res.json())
            .then(data => {
              if (data?.routes?.[0]?.geometry?.coordinates) {
                const routeCoords = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
                if (leafletRoutePolylineRef.current) leafletRoutePolylineRef.current.remove();
                
                const polyline = L.polyline(routeCoords, {
                  color: '#006A6A',
                  weight: 5,
                  opacity: 0.85,
                  lineCap: 'round',
                  lineJoin: 'round'
                }).addTo(map);
                leafletRoutePolylineRef.current = polyline;
                map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
              }
            })
            .catch(() => {
              const line = L.polyline([[lat, lng], [dropLocation.lat, dropLocation.lng]], {
                color: '#006A6A',
                weight: 4,
                dashArray: '8, 8'
              }).addTo(map);
              leafletRoutePolylineRef.current = line;
            });
        }
      } else {
        const map = leafletMapRef.current;
        if (leafletDriverMarkerRef.current) {
          leafletDriverMarkerRef.current.setLatLng([lat, lng]);
        }
        if (leafletTileLayerRef.current) {
          map.removeLayer(leafletTileLayerRef.current);
          const tileUrl = mapType === 'satellite'
            ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            : mapType === 'dark'
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
          leafletTileLayerRef.current = L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);
        }
      }
    } catch (err) {
      console.warn('Leaflet render error:', err);
    }
  }, [mapEngine, lat, lng, heading, mapType, dropLocation?.lat, dropLocation?.lng]);

  const googleNavUrl = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${encodeURIComponent(dropAddress || (dropLocation ? `${dropLocation.lat},${dropLocation.lng}` : driverAddress || 'Destination'))}&travelmode=driving`;

  const isOffline = status === 'Offline';

  // Google Maps Embed URL (Reliable endpoint without Embed API activation restriction)
  const googleEmbedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;

  // ── No Driver Geolocation State ─────────────────────────────────────────────
  if (!lat && !lng) {
    return (
      <div style={{ height }} className="w-full rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
        <AlertTriangle className="h-10 w-10 text-amber-400 animate-pulse" />
        <h4 className="text-base font-bold">GPS Location Unavailable</h4>
        <p className="text-xs text-slate-400 max-w-sm">No live GPS telemetry stream detected for vehicle <strong className="text-white">{vehicleNumber}</strong>.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-900 text-slate-800 dark:text-white">
      {/* ── 🎯 EXACT GOOGLE MAPS FLOATING INFO CARD OVERLAY (Top Left - Matching Screenshot) ── */}
      <div className="absolute top-3 left-3 z-20 max-w-[280px] sm:max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white transition-all text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white leading-tight truncate">
              {driverName} ({vehicleNumber})
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-normal line-clamp-2" title={driverAddress}>
              {driverAddress || 'Locating current street address...'}
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs">
              <span className="font-bold text-amber-500 flex items-center gap-1">
                4.8 ★ <span className="text-slate-400 font-normal dark:text-slate-500">(206)</span>
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                ⚡ {Math.round(speed)} km/h
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Share / Open External Details */}
            <a
              href={googleNavUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400 transition-colors shadow-xs"
              title="Open Google Maps Location"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Blue Google Maps Directions Button (Matching Screenshot Icon) */}
            <a
              href={googleNavUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              title="Get Google Maps Navigation Directions"
            >
              <Navigation className="w-5 h-5 fill-white text-white" />
            </a>
          </div>
        </div>
      </div>

      {/* ── Top-Right Engine Switcher Badge ── */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        <button
          onClick={() => setMapEngine(mapEngine === 'google_embed' ? 'interactive' : 'google_embed')}
          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <MapIcon className="w-3.5 h-3.5 text-blue-500" />
          <span>{mapEngine === 'google_embed' ? 'Google Maps View' : 'Live Route View'}</span>
        </button>
      </div>

      {/* ── MAP VIEWPORT ── */}
      <div className="relative w-full z-0" style={{ height }}>
        {mapEngine === 'google_embed' ? (
          /* NATIVE GOOGLE MAPS EMBED VIEW (Matching Screenshot) */
          <iframe
            title="Google Maps Current Geolocation Embed"
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0, height: '100%', width: '100%' }}
            src={googleEmbedUrl}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full"
          />
        ) : (
          /* INTERACTIVE ROUTE MAP CANVAS */
          <div ref={containerRef} style={{ height }} className="w-full h-full z-0" />
        )}
      </div>

      {/* ── Right Controls (When in Interactive Mode) ── */}
      {showControls && mapEngine === 'interactive' && (
        <div className="absolute top-16 right-3 z-10 flex flex-col gap-1.5">
          <button
            onClick={() => {
              if (leafletMapRef.current) leafletMapRef.current.zoomIn();
            }}
            className="w-9 h-9 rounded-xl bg-white/95 dark:bg-slate-900/95 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-md transition-all cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (leafletMapRef.current) leafletMapRef.current.zoomOut();
            }}
            className="w-9 h-9 rounded-xl bg-white/95 dark:bg-slate-900/95 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-md transition-all cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (leafletMapRef.current) leafletMapRef.current.setView([lat, lng], 15);
            }}
            className="w-9 h-9 rounded-xl bg-white/95 dark:bg-slate-900/95 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#006A6A] dark:text-[#14B8A6] flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-md transition-all cursor-pointer"
            title="Recenter Driver"
          >
            <LocateFixed className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMapType(prev => prev === 'roadmap' ? 'satellite' : prev === 'satellite' ? 'dark' : 'roadmap')}
            className="w-9 h-9 rounded-xl bg-white/95 dark:bg-slate-900/95 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-md transition-all cursor-pointer uppercase text-[10px] font-bold"
            title="Toggle Map Style"
          >
            <Layers className="w-4 h-4 text-[#006A6A] dark:text-[#14B8A6]" />
          </button>
        </div>
      )}

      {/* ── Bottom Telemetry Route Status Bar ── */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 p-2.5 px-3.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-xs shadow-md text-slate-800 dark:text-white">
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${isOffline ? 'bg-slate-400' : 'bg-emerald-500 animate-ping'}`} />
          <span className="font-extrabold text-slate-900 dark:text-slate-100">
            {isOffline ? '⚪ Driver Offline' : `🟢 ${status || 'Live Telemetry Active'}`}
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="font-semibold text-slate-600 dark:text-slate-300">
            Speed: <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">{Math.round(speed)} km/h</strong>
          </span>
          {heading !== undefined && (
            <>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-[#006A6A] dark:text-[#14B8A6]" /> {heading}°
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {distanceRemaining > 0 && (
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              Remaining: <strong className="text-slate-900 dark:text-white font-extrabold">{distanceRemaining} km</strong>
            </span>
          )}
          {eta && (
            <span className="font-extrabold text-[#006A6A] dark:text-[#14B8A6] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> ETA: {eta}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
