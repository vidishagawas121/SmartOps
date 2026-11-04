import React, { useState, useEffect } from 'react';
import { useOperations } from '../../store/OperationsContext';
import { Button } from '../../components/ui/Button';
import { soundPlayer } from '../../utils/audio';
import {
  User,
  Mail,
  Phone,
  Building,
  Upload,
  Edit2,
  CheckCircle,
  Award,
  Lock,
  LogOut,
  Truck,
  ShieldCheck
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { vehicles, user, logout, triggerNotification, addActivity, updateProfile } = useOperations();
  const driverVehicle = vehicles[0] || { vehicleNumber: user?.vehicleNumber || 'MH-12-QW-9874' };

  // Profile state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobileNumber, setMobileNumber] = useState(user?.mobileNumber || '');
  const [licenseNumber, setLicenseNumber] = useState(user?.companyName || 'DL-MH-12-2015-0098');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');

  const [isEditing, setIsEditing] = useState(false);

  // Security password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  // Sync state if user updates, only when not editing
  useEffect(() => {
    if (user && !isEditing) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setMobileNumber(user.mobileNumber || '');
      setLicenseNumber(user.licenseNumber || 'DL-MH-12-2015-0098');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user, isEditing]);

  // Play audio sound feedback
  const playSound = (severity: 'Success' | 'Warning' | 'Error' | 'Info') => {
    const savedSettings = localStorage.getItem('smartops_owner_settings');
    const settings = savedSettings ? JSON.parse(savedSettings) : { soundEnabled: true, soundVolume: 0.5 };
    if (settings.soundEnabled) {
      soundPlayer.play(severity, settings.soundVolume);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await updateProfile({
        fullName: fullName.trim(),
        email: email.trim(),
        mobileNumber: mobileNumber.trim(),
        licenseNumber: licenseNumber.trim()
      });
      setIsEditing(false);
      playSound('Success');
      triggerNotification('System Alert', 'Driver Profile Saved', 'Your operator credentials and license details have been updated.', 'Info');
      addActivity('Profile Modified', 'Updated driver personal contact and license details', 'task');
      alert(res?.message || 'Driver profile updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to update driver profile.');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File is too large. Please select an image under 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setAvatarUrl(base64String);

        try {
          await updateProfile({ avatarUrl: base64String });
          playSound('Success');
          triggerNotification('System Alert', 'Avatar Updated', 'Your profile picture has been updated and saved.', 'Info');
          addActivity('Profile Modified', 'Updated driver profile avatar image', 'task');
        } catch (err: any) {
          alert(err.response?.data?.message || 'Failed to save avatar image.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      alert('New passwords do not match.');
      return;
    }
    playSound('Success');
    triggerNotification('System Alert', 'Passphrase Updated', 'Your operator login passphrase code has been updated successfully.', 'Info');
    addActivity('Security Modified', 'Updated driver account login password', 'task');
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    });
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16 text-left animate-fade-in">
      {/* Header */}
      <div className="border-b border-[#E5EEFF] dark:border-[#334155] pb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-extrabold text-[#0B1C30] dark:text-white tracking-tight flex items-center gap-2.5 leading-none">
            <User className="h-7 w-7 text-[#006A6A] dark:text-[#14B8A6]" />
            Operator Commercial Profile
          </h2>
          <p className="text-[13px] text-[#6D7A79] dark:text-[#94A3B8] mt-1.5 font-medium">
            Review commercial driver credentials, Class A license bindings, and security account settings.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={logout}
          className="text-xs font-bold py-2 border border-red-200 dark:border-red-950/40 text-[#EF4444] hover:bg-red-50/50 flex items-center gap-1.5 rounded-xl cursor-pointer shadow-sm"
        >
          <LogOut className="h-4 w-4" /> Logout Session
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Avatar Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#1E293B] border border-[#E5EEFF] dark:border-[#334155] rounded-2xl p-6 shadow-sm text-center flex flex-col items-center">
            <div
              onClick={() => document.getElementById('driver-avatar-input')?.click()}
              className="relative group cursor-pointer"
            >
              <img
                src={avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName || 'Driver')}&backgroundColor=006A6A`}
                alt="Driver Avatar"
                className="w-24 h-24 rounded-full object-cover border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] p-1 shadow-sm"
              />
              <div className="absolute inset-0 bg-slate-950/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="h-5 w-5 text-white" />
              </div>
              <input
                type="file"
                id="driver-avatar-input"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <h3 className="text-[15px] font-bold text-[#0B1C30] dark:text-white mt-4">{fullName || 'Driver'}</h3>
            <p className="text-[11px] text-[#6D7A79] dark:text-[#94A3B8] font-bold uppercase mt-1 tracking-wider">
              Driver ID: {user?.driverId || 'DRV-8106'}
            </p>
            <span className="mt-3 px-3 py-1 rounded-full text-xs font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/15 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" /> Verified Fleet Operator
            </span>

            <div className="mt-3 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-[#006A6A]/10 text-[#006A6A] dark:text-[#7DF5F5] border border-[#006A6A]/15 flex items-center gap-1.5">
              <Award className="h-4 w-4" />
              <span>Safety Rating: 100%</span>
            </div>

            <div className="w-full border-t border-[#E5EEFF] dark:border-[#334155] mt-6 pt-5 space-y-3.5 text-xs text-[#6D7A79] dark:text-[#94A3B8] font-semibold text-left">
              <div className="flex justify-between items-center">
                <span>Duty Status:</span>
                <span className="text-[#10B981] font-bold">On Duty</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Assigned Truck:</span>
                <span className="text-[#0B1C30] dark:text-[#F8FAFC] font-mono font-bold">{driverVehicle?.vehicleNumber || 'MH-12-QW-9874'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>License Class:</span>
                <span className="text-[#0B1C30] dark:text-[#F8FAFC] font-bold">Class A Commercial</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Onboarded Date:</span>
                <span className="text-[#0B1C30] dark:text-[#F8FAFC]">2026-02-15</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Details & Security Cards */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Particulars Form */}
          <div className="bg-white dark:bg-[#1E293B] border border-[#E5EEFF] dark:border-[#334155] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="border-b border-[#E5EEFF] dark:border-[#334155] pb-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-[#006A6A] dark:text-[#14B8A6]" />
                <h3 className="text-[15px] font-bold text-[#0B1C30] dark:text-white">Operator Particulars</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs font-bold text-[#006A6A] dark:text-[#14B8A6] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="h-3 w-3" /> {isEditing ? 'Cancel Edit' : 'Edit Credentials'}
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Driver Full Name</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full px-4 h-12 text-sm border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] dark:bg-[#0F172A] dark:text-white focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium disabled:opacity-65"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Operator Email</label>
                  <input
                    type="email"
                    disabled={!isEditing}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 h-12 text-sm border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] dark:bg-[#0F172A] dark:text-white focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium disabled:opacity-65"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Contact Mobile Number</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={mobileNumber}
                    onChange={e => setMobileNumber(e.target.value)}
                    className="w-full px-4 h-12 text-sm border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] dark:bg-[#0F172A] dark:text-white focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium disabled:opacity-65 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Commercial License No.</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={licenseNumber}
                    onChange={e => setLicenseNumber(e.target.value)}
                    className="w-full px-4 h-12 text-sm border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] dark:bg-[#0F172A] dark:text-white focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium disabled:opacity-65 font-mono"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end gap-2.5 pt-2">
                  <Button type="submit" variant="primary" className="text-xs font-bold py-2.5 rounded-xl cursor-pointer">
                    Save Changes
                  </Button>
                </div>
              )}
            </form>
          </div>

          {/* Change Security Password Card */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-[#E5EEFF] dark:border-[#334155] shadow-sm space-y-4">
            <div className="border-b border-[#E5EEFF] dark:border-[#334155] pb-3 flex items-center gap-2">
              <Lock className="h-5 w-5 text-[#006A6A] dark:text-[#14B8A6]" />
              <h3 className="text-[15px] font-bold text-[#0B1C30] dark:text-white">Security & Passphrase</h3>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Current Passphrase</label>
                  <input
                    type="password"
                    required
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="••••••"
                    className="w-full px-4 h-11 border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] dark:bg-[#0F172A] text-[#0B1C30] dark:text-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">New Passphrase</label>
                  <input
                    type="password"
                    required
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="••••••"
                    className="w-full px-4 h-11 border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] dark:bg-[#0F172A] text-[#0B1C30] dark:text-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Confirm Passphrase</label>
                  <input
                    type="password"
                    required
                    name="confirmNewPassword"
                    value={passwordForm.confirmNewPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="••••••"
                    className="w-full px-4 h-11 border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] dark:bg-[#0F172A] text-[#0B1C30] dark:text-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" className="text-xs font-bold py-2.5 rounded-xl border border-transparent shadow-sm cursor-pointer">
                  Save Credentials
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
