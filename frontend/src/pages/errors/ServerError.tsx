import React from 'react';
import { Button } from '../../components/ui/Button';
import { ServerCrash } from 'lucide-react';

export const ServerError: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6 text-center text-slate-800 dark:text-slate-100">
      <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-lg space-y-5">
        <div className="p-3 bg-red-500/10 text-red-500 rounded-full w-fit mx-auto">
          <ServerCrash className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-black tracking-tight">500 - Server Offline</h2>
        <p className="text-xs text-slate-400 dark:text-[#6D7A79] leading-normal">
          The API cluster could not process this requests. Geofencing telemetry loops are offline.
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="w-full bg-primary hover:bg-primary/95 text-white py-2 rounded-xl text-xs font-bold"
        >
          Check cluster status again
        </Button>
      </div>
    </div>
  );
};

