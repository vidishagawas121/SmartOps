import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { useOperations } from '../../store/OperationsContext';
import { useTheme } from '../../store/ThemeContext';
import {
  Settings as SettingsIcon,
  Building2,
  Sliders,
  Bell,
  Save,
  RotateCcw,
  Sun,
  Moon,
  Edit2,
  Check,
  Lock,
  X,
} from 'lucide-react';

interface OwnerSettingsState {
  companyName: string;
  gstNumber: string;
  address: string;
  branchDetails: string;
  language: string;
  timeZone: string;
  currency: string;
  dateFormat: string;
  defaultDashboard: string;
  tableDensity: 'compact' | 'comfortable' | 'spacious';
  emailNotif: boolean;
  smsNotif: boolean;
  pushNotif: boolean;
  browserNotif: boolean;
  alertAttendance: boolean;
  alertInventory: boolean;
  alertFleet: boolean;
  alertLowStock: boolean;
  alertSalary: boolean;
  twoFactorAuth: boolean;
}

const DEFAULT_SETTINGS: OwnerSettingsState = {
  companyName: 'Enterprise Portal',
  gstNumber: '27AAAAA1111A1Z1',
  address: 'Corporate Park, Sector V, Phase 2, Pune, MH, India',
  branchDetails: 'Pune Yard (HQ), Mumbai Transit Hub, Bangalore Warehouse',
  language: 'English',
  timeZone: 'IST (UTC+05:30)',
  currency: 'INR (?)',
  dateFormat: 'YYYY-MM-DD',
  defaultDashboard: 'Executive Overview',
  tableDensity: 'comfortable',
  emailNotif: true,
  smsNotif: false,
  pushNotif: true,
  browserNotif: true,
  alertAttendance: true,
  alertInventory: true,
  alertFleet: true,
  alertLowStock: true,
  alertSalary: true,
  twoFactorAuth: false
};

export const Settings: React.FC = () => {
  const { user, triggerNotification, addActivity } = useOperations();
  const { theme, toggleTheme } = useTheme();

  // Settings State loaded from localStorage
  const [settings, setSettings] = useState<OwnerSettingsState>(() => {
    const saved = localStorage.getItem('smartops_owner_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // Logo upload state
  const [logoPreview, setLogoPreview] = useState<string>(
    'https://api.dicebear.com/7.x/identicon/svg?seed=SmartOps'
  );

  // Edit state for Company Information
  const [isEditingCompany, setIsEditingCompany] = useState(false);

  useEffect(() => {
    if (user?.companyName) {
      setSettings(prev => ({ ...prev, companyName: user.companyName! }));
    }
  }, [user?.companyName]);

  useEffect(() => {
    localStorage.setItem('smartops_owner_settings', JSON.stringify(settings));
  }, [settings]);

  // Handle Input Changes
  const handleChange = (key: keyof OwnerSettingsState, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Actions
  const handleSaveCompanyInfo = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    localStorage.setItem('smartops_owner_settings', JSON.stringify(settings));
    setIsEditingCompany(false);

    triggerNotification(
      'System Alert',
      'Company Info Saved',
      'Corporate registration details saved successfully.',
      'Info'
    );
    addActivity('Company Info Modified', 'Updated corporate registration details', 'task');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('smartops_owner_settings', JSON.stringify(settings));
    setIsEditingCompany(false);

    triggerNotification(
      'System Alert',
      'Settings Updated',
      'Corporate configuration and preference rules synchronized successfully.',
      'Info'
    );
    addActivity('Settings Configuration', 'Updated global settings preferences', 'task');
    alert('Settings saved successfully!');
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all configurations to default values?')) {
      setSettings(DEFAULT_SETTINGS);
      triggerNotification(
        'System Alert',
        'Settings Reset',
        'Settings properties reset to system default variables.',
        'Warning'
      );
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 animate-fade-in text-left">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800 pb-5 gap-4">
        <div>
          <h2 className="text-[26px] font-extrabold text-[#0B1C30] dark:text-white tracking-tight flex items-center gap-2.5 leading-none">
            <SettingsIcon className="h-7 w-7 text-[#006A6A] dark:text-[#14B8A6] animate-spin-slow" />
            System Control Panel
          </h2>
          <p className="text-[13px] text-[#6D7A79] dark:text-[#94A3B8] mt-1.5 font-medium">
            Configure system parameters, notification alerts, security settings, and data privacy.
          </p>
        </div>
        <div className="flex gap-2.5 self-stretch sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="text-xs font-semibold py-2 border border-[#E5EEFF] dark:border-[#334155] bg-white hover:bg-[#F8F9FF] rounded-xl"
          >
            <RotateCcw className="h-4 w-4 text-slate-400" /> Reset All
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            variant="primary"
            className="text-xs font-bold py-2 rounded-xl shadow-md shadow-teal-900/10"
          >
            <Save className="h-4 w-4" /> Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Navigation Tabs (Anchor Links) */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-white dark:bg-[#1E293B] border border-[#E5EEFF] dark:border-[#334155] rounded-2xl p-5 sticky top-24 shadow-sm text-left">
            <h3 className="text-xs font-bold text-slate-400 dark:text-[#6D7A79] uppercase tracking-widest mb-4">
              Dashboard Sections
            </h3>
            <nav className="space-y-1">
              {[
                { label: 'Company Information', id: '#company', icon: Building2 },
                { label: 'System Preferences', id: '#preferences', icon: Sliders },
                { label: 'Notification Triggers', id: '#notifications', icon: Bell }
              ].map(tab => (
                <a
                  key={tab.id}
                  href={tab.id}
                  className="flex items-center gap-3 px-3.5 py-3 text-xs font-bold text-[#6D7A79] dark:text-[#94A3B8] hover:text-[#006A6A] dark:hover:text-[#14B8A6] rounded-xl hover:bg-[#F8F9FF] dark:hover:bg-slate-800/50 transition-all font-semibold"
                >
                  <tab.icon className="h-4 w-4 text-slate-400" />
                  {tab.label}
                </a>
              ))}
            </nav>
            <div className="border-t border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800 mt-6 pt-4 text-center">
              <span className="text-[10px] text-slate-400 font-bold">SmartOps Admin Module • v4.1.2</span>
            </div>
          </div>
        </div>

        {/* Right Settings Form Container */}
        <div className="lg:col-span-2 space-y-8 text-left">
          {/* SECTION 1: COMPANY INFORMATION */}
          <section id="company" className="bg-white dark:bg-[#1E293B] border border-[#E5EEFF] dark:border-[#334155] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="border-b border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800 pb-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#006A6A]/10 text-[#006A6A] dark:text-[#14B8A6]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#0B1C30] dark:text-white uppercase tracking-wide">Company Information</h3>
                </div>
              </div>

              {!isEditingCompany ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingCompany(true)}
                  className="text-xs font-bold py-1.5 px-3.5 border-[#006A6A]/30 text-[#006A6A] hover:bg-[#006A6A]/10 dark:text-[#14B8A6] rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit Info
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" /> Editing Active
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingCompany(false)}
                    className="text-xs font-semibold py-1.5 px-3 rounded-xl border-slate-300 dark:border-slate-700 flex items-center gap-1"
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleSaveCompanyInfo}
                    className="text-xs font-bold py-1.5 px-3.5 rounded-xl flex items-center gap-1 bg-[#006A6A] hover:bg-[#005555] shadow-xs"
                  >
                    <Check className="h-3.5 w-3.5" /> Save Info
                  </Button>
                </div>
              )}
            </div>

            {!isEditingCompany && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#006A6A] dark:text-[#14B8A6] shrink-0" />
                <span>Company information is currently locked in view-only mode. Click <strong>Edit Info</strong> above to modify corporate attributes.</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <img
                  src={logoPreview}
                  alt="Company Logo"
                  className="w-16 h-16 rounded-xl border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF]/50 dark:bg-[#0F172A] p-2 shadow-sm"
                />
                <div className="text-left">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-[#CBD5E1]">Corporate Brand Logo</h4>
                  <p className="text-[11px] text-[#6D7A79] dark:text-[#6D7A79] mt-0.5 font-medium">Upload a 200x200 PNG or SVG branding asset.</p>
                  {isEditingCompany ? (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          setLogoPreview(URL.createObjectURL(e.target.files[0]));
                        }
                      }}
                      className="mt-2 text-[11px] font-semibold text-[#6D7A79] file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-[#545F73] dark:file:text-slate-300 hover:file:bg-slate-200 cursor-pointer"
                    />
                  ) : (
                    <span className="inline-block mt-2 text-[11px] font-medium text-slate-400 dark:text-slate-500 italic">
                      Click Edit Info to change brand logo
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Company Registered Name</label>
                  <input
                    type="text"
                    disabled={!isEditingCompany}
                    value={settings.companyName}
                    onChange={e => handleChange('companyName', e.target.value)}
                    className={`w-full px-4 h-12 text-sm border rounded-xl focus:outline-none transition-all font-medium ${
                      isEditingCompany
                        ? 'border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 cursor-not-allowed'
                    }`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">GST Identification Number</label>
                  <input
                    type="text"
                    disabled={!isEditingCompany}
                    value={settings.gstNumber}
                    onChange={e => handleChange('gstNumber', e.target.value)}
                    className={`w-full px-4 h-12 text-sm border rounded-xl focus:outline-none transition-all font-medium ${
                      isEditingCompany
                        ? 'border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 cursor-not-allowed'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Registered Office Address</label>
                <textarea
                  rows={2}
                  disabled={!isEditingCompany}
                  value={settings.address}
                  onChange={e => handleChange('address', e.target.value)}
                  className={`w-full px-4 py-3 text-sm border rounded-xl focus:outline-none transition-all font-medium resize-none ${
                    isEditingCompany
                      ? 'border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 cursor-not-allowed'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Branch Locations Directory</label>
                <input
                  type="text"
                  disabled={!isEditingCompany}
                  value={settings.branchDetails}
                  onChange={e => handleChange('branchDetails', e.target.value)}
                  className={`w-full px-4 h-12 text-sm border rounded-xl focus:outline-none transition-all font-medium ${
                    isEditingCompany
                      ? 'border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>
          </section>

          {/* SECTION 2: SYSTEM PREFERENCES */}
          <section id="preferences" className="bg-white dark:bg-[#1E293B] border border-[#E5EEFF] dark:border-[#334155] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="border-b border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800 pb-3.5 flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#006A6A]/10 text-[#006A6A] dark:text-[#14B8A6]">
                <Sliders className="h-5 w-5" />
              </div>
              <h3 className="text-[15px] font-bold text-[#0B1C30] dark:text-white uppercase tracking-wide">System Preferences</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Display Theme Mode</label>
                <div className="flex gap-2 max-w-xs">
                  <button
                    type="button"
                    onClick={() => theme !== 'light' && toggleTheme()}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      theme === 'light'
                        ? 'bg-[#006A6A] text-white border-transparent shadow-sm'
                        : 'border-[#E5EEFF] dark:border-[#334155] text-[#6D7A79] hover:bg-[#F8F9FF]/50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Sun className="h-4 w-4" /> Light
                  </button>
                  <button
                    type="button"
                    onClick={() => theme !== 'dark' && toggleTheme()}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      theme === 'dark'
                        ? 'bg-slate-950 text-white border-transparent shadow-md'
                        : 'border-[#E5EEFF] dark:border-[#334155] text-[#6D7A79] hover:bg-slate-100'
                    }`}
                  >
                    <Moon className="h-4 w-4" /> Dark
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: NOTIFICATIONS ALERT CHANNELS */}
          <section id="notifications" className="bg-white dark:bg-[#1E293B] border border-[#E5EEFF] dark:border-[#334155] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="border-b border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800 pb-3.5 flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#006A6A]/10 text-[#006A6A] dark:text-[#14B8A6]">
                <Bell className="h-5 w-5" />
              </div>
              <h3 className="text-[15px] font-bold text-[#0B1C30] dark:text-white uppercase tracking-wide">Notification Channels & Telemetry Triggers</h3>
            </div>

            <div className="space-y-5">
              <div>
                <h4 className="text-[13px] font-bold text-slate-700 dark:text-[#CBD5E1] mb-3 text-left">Alert Dispatch Channels</h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Email Alerts', desc: 'Sends daily consolidated digests', key: 'emailNotif' },
                    { label: 'SMS Alerts', desc: 'Critical alerts on dispatcher mobile', key: 'smsNotif' },
                    { label: 'Push Console Alerts', desc: 'Realtime socket popup bubbles', key: 'pushNotif' },
                    { label: 'Browser Notifications', desc: 'Native OS background popups', key: 'browserNotif' }
                  ].map(channel => (
                    <label key={channel.key} className="flex items-start gap-3 p-3.5 border border-[#E5EEFF] dark:border-[#334155] rounded-xl cursor-pointer hover:bg-[#F8F9FF]/40 dark:hover:bg-slate-950/20 shadow-sm">
                      <input
                        type="checkbox"
                        checked={(settings as any)[channel.key]}
                        onChange={e => handleChange(channel.key as any, e.target.checked)}
                        className="mt-1 h-4 w-4 text-[#006A6A] focus:ring-[#006A6A] rounded border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF]"
                      />
                      <div className="text-left">
                        <span className="text-sm font-bold text-[#0B1C30] dark:text-[#CBD5E1] block">{channel.label}</span>
                        <span className="text-[11px] text-[#6D7A79] dark:text-[#6D7A79] block mt-0.5 font-medium">{channel.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800 pt-4">
                <h4 className="text-[13px] font-bold text-slate-700 dark:text-[#CBD5E1] mb-3 text-left">Telemetry Notification Rules</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Attendance Alerts', desc: 'Trigger if staff checks in Late, on breaks or leaves early', key: 'alertAttendance' },
                    { label: 'Inventory Movements', desc: 'Notify on raw/finished storage receipts', key: 'alertInventory' },
                    { label: 'Fleet Telemetry Events', desc: 'Alert on speed limits breach, delay, or trip start/stop', key: 'alertFleet' },
                    { label: 'Low Stock Safety Alerts', desc: 'Emergency warnings when item count drops below safety threshold', key: 'alertLowStock' },
                    { label: 'Salary Disbursement Logs', desc: 'Notify when monthly salaries are calculated and paid', key: 'alertSalary' }
                  ].map(rule => (
                    <div key={rule.key} className="flex justify-between items-center text-left py-2 border-b border-[rgba(11,28,48,0.04)] last:border-0">
                      <div>
                        <span className="font-bold block text-[#0B1C30] dark:text-[#F8FAFC] text-sm leading-tight">{rule.label}</span>
                        <span className="text-[11px] text-[#6D7A79] dark:text-[#6D7A79] block mt-0.5 font-medium">{rule.desc}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={(settings as any)[rule.key]}
                        onChange={e => handleChange(rule.key as any, e.target.checked)}
                        className="h-4 w-4 text-[#006A6A] border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] rounded focus:ring-[#006A6A]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};


