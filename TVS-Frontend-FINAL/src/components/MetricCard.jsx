import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { fmt } from '../utils/api';
export default function MetricCard({ label, value, prev, format = 'currency', icon: Icon, color, className = '' }) {
  const fmtMap = { currency: fmt.currency, number: fmt.number, pct: fmt.pct, x: fmt.x, compact: fmt.compact };
  const display = fmtMap[format] ? fmtMap[format](value) : value;
  const ch = prev != null ? fmt.change(value, prev) : null;
  return (
    <div className={`group relative bg-white rounded-2xl border border-surface-100 p-5 hover:shadow-cardHover hover:border-surface-200 transition-all duration-300 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-[0.08em]">{label}</span>
        {Icon && <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color || 'bg-brand-50 text-brand-600'} transition-transform group-hover:scale-110`}><Icon size={16} /></div>}
      </div>
      <div className="text-2xl font-display font-bold text-surface-900 tracking-tight">{display}</div>
      {ch && <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${ch.dir==='up'?'text-emerald-600':ch.dir==='down'?'text-red-500':'text-surface-400'}`}>{ch.dir==='up'?<TrendingUp size={13}/>:ch.dir==='down'?<TrendingDown size={13}/>:<Minus size={13}/>}<span>{Math.abs(ch.pct)}%</span><span className="text-surface-400 font-normal ml-0.5">vs prior</span></div>}
    </div>
  );
}
