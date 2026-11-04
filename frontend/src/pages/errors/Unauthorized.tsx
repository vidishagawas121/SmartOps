import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { ShieldAlert } from 'lucide-react';

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6 text-center text-slate-800 dark:text-slate-100">
      <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-lg space-y-5">
        <div className="p-3 bg-red-500/10 text-red-500 rounded-full w-fit mx-auto animate-pulse">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-black tracking-tight">403 - Access Forbidden</h2>
        <p className="text-xs text-slate-400 dark:text-[#6D7A79] leading-normal">
          You do not possess the required JWT role claim bindings to inspect this console node.
        </p>
        <Button
          onClick={() => navigate('/login')}
          className="w-full bg-red-500 hover:bg-red-650 text-white py-2 rounded-xl text-xs font-bold"
        >
          Re-authenticate session
        </Button>
      </div>
    </div>
  );
};

