import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('credentials'); // credentials | otp | reset
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [newPass, setNewPass] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setInfo(''); setLoading(true);
    try {
      if (step === 'credentials') {
        const { data } = await api.post('/auth/login', { email, password });
        if (data.otpRequired) {
          setStep('otp');
          setInfo(data.message || 'Check your email for the verification code');
        } else if (data.token) {
          localStorage.setItem('tvs_token', data.token);
          window.location.reload();
        }
      } else if (step === 'otp') {
        const { data } = await api.post('/auth/login', { email, password, otp });
        if (data.token) {
          localStorage.setItem('tvs_token', data.token);
          window.location.reload();
        }
      }
    } catch (err) { setError(err.response?.data?.error || 'Login failed'); }
    finally { setLoading(false); }
  };

  const [resetOtp, setResetOtp] = useState('');
  const [resetStep, setResetStep] = useState('email'); // email | otp

  const handleReset = async (e) => {
    e.preventDefault(); setError(''); setInfo('');
    try {
      if (resetStep === 'email') {
        const { data } = await api.post('/auth/reset-password', { email });
        if (data.otpRequired) { setResetStep('otp'); setInfo(data.message || 'Check your email for reset code'); }
      } else {
        const { data } = await api.post('/auth/reset-password', { email, new_password: newPass, otp: resetOtp });
        setInfo(data.message || 'Password reset! Login now.');
        setStep('credentials'); setResetStep('email'); setResetOtp('');
      }
    } catch (err) { setError(err.response?.data?.error || 'Reset failed'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sidebar-950 via-sidebar-900 to-sidebar-800 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20" style={{backgroundImage:'radial-gradient(circle at 30% 50%, rgba(241,195,73,0.15) 0%, transparent 50%)'}} />
      <div className="relative w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <img src="https://ik.imagekit.io/iovvborjj/Vitamin%20Shots%20Logo%20with%20Tag%20Line%20(1).jpg?updatedAt=1770353893288" alt="VS" className="w-20 h-20 rounded-2xl mx-auto mb-4 shadow-glow object-cover" />
          <h1 className="text-2xl font-display font-bold text-white">Vitamin Shots</h1>
          <p className="text-sidebar-400 text-sm mt-1">Finance Minister</p>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-modal">
          {step === 'credentials' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div><label className="block text-xs font-semibold text-sidebar-300 mb-1.5 uppercase tracking-wider">Email</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-sidebar-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 text-sm" placeholder="your@email.com" /></div>
              <div><label className="block text-xs font-semibold text-sidebar-300 mb-1.5 uppercase tracking-wider">Password</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-sidebar-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 text-sm" /></div>
              {error && <div className="text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-xl">{error}</div>}
              {info && <div className="text-emerald-400 text-sm bg-emerald-500/10 px-3 py-2 rounded-xl">{info}</div>}
              <button type="submit" disabled={loading} className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-display font-bold text-sm transition-all shadow-glow disabled:opacity-50">
                {loading ? 'Verifying...' : 'Continue'}
              </button>
              <button type="button" onClick={() => setStep('reset')} className="w-full text-xs text-sidebar-400 hover:text-brand-400">Reset password</button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="text-center mb-2">
                <div className="text-3xl mb-2">🔐</div>
                <h3 className="text-white font-display font-bold">Verification Code</h3>
                <p className="text-sidebar-400 text-xs mt-1">We sent a 6-digit code to {email}</p>
              </div>
              <div>
                <input type="text" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} required maxLength={6} placeholder="000000"
                  className="w-full px-4 py-4 bg-white/10 border border-white/10 rounded-xl text-white text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-brand-400/50" autoFocus />
              </div>
              {error && <div className="text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-xl">{error}</div>}
              {info && <div className="text-emerald-400 text-sm bg-emerald-500/10 px-3 py-2 rounded-xl">{info}</div>}
              <button type="submit" disabled={loading || otp.length !== 6} className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-display font-bold text-sm disabled:opacity-50">
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              <button type="button" onClick={() => { setStep('credentials'); setOtp(''); setError(''); }} className="w-full text-xs text-sidebar-400 hover:text-brand-400">Back to login</button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleReset} className="space-y-5">
              <p className="text-sidebar-300 text-sm">{resetStep === 'email' ? 'Enter your authorized email to receive a reset code.' : 'Enter the code and your new password.'}</p>
              <div><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="Email" className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-400/50 text-sm" /></div>
              {resetStep === 'otp' && <>
                <div><input type="text" value={resetOtp} onChange={e=>setResetOtp(e.target.value.replace(/\D/g,'').slice(0,6))} required maxLength={6} placeholder="000000" className="w-full px-4 py-4 bg-white/10 border border-white/10 rounded-xl text-white text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-brand-400/50" /></div>
                <div><input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} required minLength={8} placeholder="New password (8+ chars)" className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-400/50 text-sm" /></div>
              </>}
              {error && <div className="text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-xl">{error}</div>}
              {info && <div className="text-emerald-400 text-sm bg-emerald-500/10 px-3 py-2 rounded-xl">{info}</div>}
              <button type="submit" className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-display font-bold text-sm">{resetStep === 'email' ? 'Send Reset Code' : 'Reset Password'}</button>
              <button type="button" onClick={() => { setStep('credentials'); setResetStep('email'); }} className="w-full text-xs text-sidebar-400 hover:text-brand-400">Back to login</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
