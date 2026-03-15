import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function SetupPage() {
  const { setup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await setup(email, password, name); }
    catch (err) { setError(err.response?.data?.error || 'Setup failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sidebar-950 via-sidebar-900 to-sidebar-800">
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <img src="https://ik.imagekit.io/iovvborjj/Vitamin%20Shots%20Logo%20with%20Tag%20Line%20(1).jpg?updatedAt=1770353893288" alt="Vitamin Shots" className="w-20 h-20 rounded-2xl mx-auto mb-4 shadow-glow object-cover" />
          <h1 className="text-2xl font-display font-bold text-white">Vitamin Shots Finance Minister</h1>
          <p className="text-sidebar-400 text-sm mt-1">Create your admin account</p>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
          <form onSubmit={handle} className="space-y-5">
            <div><label className="block text-xs font-semibold text-sidebar-300 mb-1.5 uppercase tracking-wider">Name</label>
              <input type="text" value={name} onChange={e=>setName(e.target.value)} required className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-400/50 text-sm" /></div>
            <div><label className="block text-xs font-semibold text-sidebar-300 mb-1.5 uppercase tracking-wider">Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-400/50 text-sm" placeholder="Only authorized emails" /></div>
            <div><label className="block text-xs font-semibold text-sidebar-300 mb-1.5 uppercase tracking-wider">Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-400/50 text-sm" /></div>
            {error && <div className="text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-xl">{error}</div>}
            <button type="submit" disabled={loading} className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-display font-bold text-sm">{loading ? 'Setting up...' : 'Create Account'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
