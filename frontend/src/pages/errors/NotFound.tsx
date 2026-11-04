import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { AlertCircle } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6 text-center text-slate-800 dark:text-slate-100">
      <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-lg space-y-5">
        <div className="p-3 bg-amber-500/10 text-amber-500 rounded-full w-fit mx-auto">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-black tracking-tight">404 - Page Not Found</h2>
        <p className="text-xs text-slate-400 dark:text-[#6D7A79] leading-normal">
          The requested routing checkpoint does not exist or has been relocated to another workspace node.
        </p>
        <Button
          onClick={() => navigate(-1)}
          className="w-full bg-primary hover:bg-primary/95 text-white py-2 rounded-xl text-xs font-bold"
        >
          Return to previous node
        </Button>
      </div>
    </div>
  );
};

