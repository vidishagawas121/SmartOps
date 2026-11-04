import React from 'react';
import { GoogleDriverMap } from '../common/GoogleDriverMap';

export interface DriverLiveMapProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  address?: string;
  vehicleNumber?: string;
  statusBadge?: 'LIVE' | 'SEARCHING' | 'DISABLED' | 'OFFLINE' | 'SYNCING';
  lastUpdatedText?: string;
  onRefreshLocation?: () => void;
}

export const DriverLiveMap: React.FC<DriverLiveMapProps> = ({
  latitude,
  longitude,
  accuracy = 6,
  speed = 0,
  heading = 0,
  address = 'Capturing live GPS coordinates...',
  vehicleNumber = 'MH-12-QW-9874',
  statusBadge = 'LIVE',
  lastUpdatedText = 'Just now',
  onRefreshLocation
}) => {
  const isOffline = statusBadge === 'OFFLINE' || statusBadge === 'DISABLED';

  return (
    <div className="w-full space-y-2">
      <GoogleDriverMap
        driverLocation={{
          lat: latitude,
          lng: longitude,
          accuracy,
          speed,
          heading,
          address
        }}
        vehicleNumber={vehicleNumber}
        status={isOffline ? 'Offline' : 'Live'}
        height="480px"
        showControls={true}
      />
    </div>
  );
};
