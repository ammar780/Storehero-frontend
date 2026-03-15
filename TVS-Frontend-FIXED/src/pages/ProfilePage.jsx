import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../utils/api';
import PageHeader from '../components/PageHeader';
import { User, Lock, Globe, DollarSign, Save, Check } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    name: user?.name || '',
    timezone: user?.timezone || 'America/New_York',
    currency: user?.currency || 'USD',
  });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put('/auth/profile', { name: form.name, timezone: form.timezone, currency: form.currency });
      toast.success('Profile updated');
    } catch (e) { toast.error(e.response?.data?.error || e.message); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (pwForm.new_password !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    if (pwForm.new_password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setPwSaving(true);
    try {
      await api.put('/auth/profile', { current_password: pwForm.current_password, new_password: pwForm.new_password });
      toast.success('Password changed successfully');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (e) { toast.error(e.response?.data?.error || e.message); }
    finally { setPwSaving(false); }
  };

  const timezones = [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Anchorage', 'Pacific/Honolulu', 'UTC', 'Europe/London', 'Europe/Paris',
    'Asia/Karachi', 'Asia/Kolkata', 'Asia/Shanghai', 'Asia/Tokyo', 'Australia/Sydney',
  ];

  const Field = ({ label, icon: Icon, children }) => (
    <div>
      <label className="flex items-center gap-2 text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
        <Icon size={14} /> {label}
      </label>
      {children}
    </div>
  );

  const inputCls = "w-full px-4 py-3 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-all";

  return (
    <div>
      <PageHeader title="Profile" subtitle="Manage your account settings" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Profile Info */}
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-6">
          <h3 className="font-display font-bold text-surface-800 dark:text-surface-200 text-lg mb-6">Account Info</h3>
          <div className="space-y-5">
            <Field label="Email" icon={User}>
              <input type="email" value={user?.email || ''} disabled className={inputCls + " opacity-60 cursor-not-allowed"} />
              <p className="text-xs text-surface-400 mt-1">Email cannot be changed</p>
            </Field>
            <Field label="Display Name" icon={User}>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Your name" />
            </Field>
            <Field label="Timezone" icon={Globe}>
              <select value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })} className={inputCls}>
                {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </Field>
            <Field label="Currency" icon={DollarSign}>
              <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className={inputCls}>
                {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'PKR'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <button onClick={saveProfile} disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-display font-bold text-sm disabled:opacity-50 transition-all">
              {saving ? 'Saving...' : <><Save size={16} /> Save Profile</>}
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-6">
          <h3 className="font-display font-bold text-surface-800 dark:text-surface-200 text-lg mb-6">Change Password</h3>
          <div className="space-y-5">
            <Field label="Current Password" icon={Lock}>
              <input type="password" value={pwForm.current_password} onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })}
                className={inputCls} placeholder="Enter current password" />
            </Field>
            <Field label="New Password" icon={Lock}>
              <input type="password" value={pwForm.new_password} onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })}
                className={inputCls} placeholder="Min 8 characters" />
            </Field>
            <Field label="Confirm New Password" icon={Check}>
              <input type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                className={inputCls} placeholder="Repeat new password" />
              {pwForm.confirm && pwForm.new_password !== pwForm.confirm && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </Field>
            <button onClick={changePassword} disabled={pwSaving || !pwForm.current_password || !pwForm.new_password}
              className="w-full flex items-center justify-center gap-2 py-3 bg-surface-800 hover:bg-surface-900 text-white rounded-xl font-display font-bold text-sm disabled:opacity-50 transition-all">
              {pwSaving ? 'Changing...' : <><Lock size={16} /> Change Password</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
