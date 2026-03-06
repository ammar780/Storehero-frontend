import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [resetMsg, setResetMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(email, password); }
    catch (err) { setError(err.response?.data?.error || 'Login failed'); }
    finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault(); setResetMsg(''); setError('');
    try {
      const { data } = await api.post('/auth/reset-password', { email, new_password: newPass });
      setResetMsg(data.message || 'Password reset! You can now login.');
      setResetMode(false);
    } catch (err) { setError(err.response?.data?.error || 'Reset failed'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sidebar-950 via-sidebar-900 to-sidebar-800 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20" style={{backgroundImage:'radial-gradient(circle at 30% 50%, rgba(241,195,73,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(241,195,73,0.1) 0%, transparent 50%)'}} />
      <div className="relative w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <img src="https://ik.imagekit.io/iovvborjj/Vitamin%20Shots%20Logo%20with%20Tag%20Line%20(1).jpg?updatedAt=1770353893288" alt="Vitamin Shots" className="w-20 h-20 rounded-2xl mx-auto mb-4 shadow-glow object-cover" />
          <h1 className="text-2xl font-display font-bold text-white">Vitamin Shots</h1>
          <p className="text-sidebar-400 text-sm mt-1">Finance Minister</p>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-modal">
          {!resetMode ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div><label className="block text-xs font-semibold text-sidebar-300 mb-1.5 uppercase tracking-wider">Email</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-sidebar-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 text-sm" placeholder="you@thevitaminshots.com" /></div>
              <div><label className="block text-xs font-semibold text-sidebar-300 mb-1.5 uppercase tracking-wider">Password</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-sidebar-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 text-sm" /></div>
              {error && <div className="text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-xl">{error}</div>}
              {resetMsg && <div className="text-emerald-400 text-sm bg-emerald-500/10 px-3 py-2 rounded-xl">{resetMsg}</div>}
              <button type="submit" disabled={loading} className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-display font-bold text-sm transition-all shadow-glow disabled:opacity-50">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <button type="button" onClick={() => setResetMode(true)} className="w-full text-xs text-sidebar-400 hover:text-brand-400 transition-colors">Forgot password? Reset it</button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <p className="text-sidebar-300 text-sm">Enter your authorized email and new password.</p>
              <div><label className="block text-xs font-semibold text-sidebar-300 mb-1.5 uppercase tracking-wider">Email</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-sidebar-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 text-sm" /></div>
              <div><label className="block text-xs font-semibold text-sidebar-300 mb-1.5 uppercase tracking-wider">New Password</label>
                <input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} required minLength={8} className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-sidebar-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 text-sm" /></div>
              {error && <div className="text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-xl">{error}</div>}
              <button type="submit" className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-display font-bold text-sm">Reset Password</button>
              <button type="button" onClick={() => setResetMode(false)} className="w-full text-xs text-sidebar-400 hover:text-brand-400">Back to login</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
