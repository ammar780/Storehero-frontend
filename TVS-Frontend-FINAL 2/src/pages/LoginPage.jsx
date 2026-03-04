import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const go = async (e) => { e.preventDefault(); setErr(''); setLoading(true); try { await login(email, pw); } catch (e) { setErr(e.response?.data?.error || 'Login failed'); } finally { setLoading(false); } };
  return (
    <div className="min-h-screen flex bg-brand-950 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden"><div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-brand-900/30 blur-3xl" /><div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-brand-800/20 blur-3xl" /></div>
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-16"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-glow"><span className="text-white font-display font-bold text-xl">V</span></div><span className="text-white font-display font-bold text-lg">TVS Profit Dashboard</span></div>
          <h2 className="text-4xl lg:text-5xl font-display font-bold text-white leading-tight tracking-tight">Know your <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-emerald-300">true profit</span><br/>on every order.</h2>
          <p className="text-brand-300/80 mt-6 text-lg leading-relaxed max-w-md">Real-time profit analytics for The Vitamin Shots. Track COGS, ad spend, LTV, and every dollar in between.</p>
        </div>
        <div className="flex items-center gap-3 text-brand-400/60 text-sm"><Sparkles size={16} /><span>Powered by your data, built for growth</span></div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8"><div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mx-auto mb-4 shadow-glow"><span className="text-white font-display font-bold text-2xl">V</span></div><h1 className="text-2xl font-display font-bold text-white">TVS Profit Dashboard</h1></div>
          <form onSubmit={go} className="bg-white/[0.07] backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-modal space-y-6 animate-scale-in">
            <div><h2 className="text-xl font-display font-bold text-white">Welcome back</h2><p className="text-brand-400 text-sm mt-1">Sign in to your dashboard</p></div>
            {err && <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-xl">{err}</div>}
            <div><label className="block text-xs font-semibold text-brand-300 mb-2 uppercase tracking-wider">Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-brand-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400/50 transition-all" placeholder="you@thevitaminshots.com" /></div>
            <div><label className="block text-xs font-semibold text-brand-300 mb-2 uppercase tracking-wider">Password</label><div className="relative"><input type={showPw?'text':'password'} value={pw} onChange={e=>setPw(e.target.value)} required className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-brand-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30 transition-all pr-12" /><button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-500 hover:text-brand-300">{showPw?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></div>
            <button type="submit" disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-display font-semibold rounded-xl transition-all duration-300 shadow-glow hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 text-sm">{loading?<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<><span>Sign In</span><ArrowRight size={16}/></>}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
