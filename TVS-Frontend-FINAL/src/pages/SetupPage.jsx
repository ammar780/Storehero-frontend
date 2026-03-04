import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Sparkles, Shield } from 'lucide-react';
export default function SetupPage() {
  const { setup } = useAuth();
  const [f, setF] = useState({ name:'', email:'', pw:'' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const go = async (e) => { e.preventDefault(); if(f.pw.length<8)return setErr('Password must be at least 8 characters'); setErr(''); setLoading(true); try{await setup(f.email,f.pw,f.name)}catch(e){setErr(e.response?.data?.error||'Setup failed')}finally{setLoading(false)} };
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-950 p-6 relative overflow-hidden">
      <div className="absolute inset-0"><div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-brand-900/30 blur-3xl" /></div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8"><div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mx-auto mb-4 shadow-glow"><Sparkles size={28} className="text-white" /></div><h1 className="text-3xl font-display font-bold text-white tracking-tight">Welcome aboard</h1><p className="text-brand-400 mt-2">Create your admin account to get started</p></div>
        <form onSubmit={go} className="bg-white/[0.07] backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-modal space-y-5 animate-scale-in">
          {err&&<div className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-xl">{err}</div>}
          <div><label className="block text-xs font-semibold text-brand-300 mb-2 uppercase tracking-wider">Name</label><input value={f.name} onChange={e=>setF({...f,name:e.target.value})} required className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-brand-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30 transition-all" placeholder="Your name"/></div>
          <div><label className="block text-xs font-semibold text-brand-300 mb-2 uppercase tracking-wider">Email</label><input type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} required className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-brand-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30 transition-all"/></div>
          <div><label className="block text-xs font-semibold text-brand-300 mb-2 uppercase tracking-wider">Password</label><input type="password" value={f.pw} onChange={e=>setF({...f,pw:e.target.value})} required minLength={8} className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-brand-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30 transition-all" placeholder="Min 8 characters"/></div>
          <button type="submit" disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-display font-semibold rounded-xl transition-all shadow-glow flex items-center justify-center gap-2 text-sm">{loading?<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<><Shield size={16}/><span>Create Account</span><ArrowRight size={16}/></>}</button>
        </form>
      </div>
    </div>
  );
}
