import { useState } from 'react';
import { Calendar } from 'lucide-react';

const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: '90d', label: '90D' },
  { key: 'ytd', label: 'YTD' },
  { key: '12m', label: '12M' },
];

export default function PeriodPicker({ value, onChange, onCustom }) {
  const [showCustom, setShowCustom] = useState(false);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const applyCustom = () => {
    if (start && end && onCustom) { onCustom(start, end); }
    else if (start && end) { onChange(`custom_${start}_${end}`); }
    setShowCustom(false);
  };

  return (
    <div className="relative">
      <div className="inline-flex bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-1 shadow-sm items-center gap-0.5">
        {PRESETS.map(p => (
          <button key={p.key} onClick={() => onChange(p.key)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${value === p.key ? 'bg-brand-500 text-white shadow-sm' : 'text-surface-500 hover:text-surface-700 dark:text-surface-400'}`}>
            {p.label}
          </button>
        ))}
        <button onClick={() => setShowCustom(!showCustom)}
          className={`p-1.5 rounded-lg transition-all ${showCustom ? 'bg-brand-500 text-white' : 'text-surface-400 hover:text-surface-600'}`}>
          <Calendar size={14} />
        </button>
      </div>

      {showCustom && (
        <div className="absolute right-0 top-full mt-2 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-lg p-3 z-50 animate-scale-in">
          <div className="flex items-center gap-2">
            <input type="date" value={start} onChange={e => setStart(e.target.value)} className="px-2 py-1.5 border border-surface-200 rounded-lg text-xs" />
            <span className="text-xs text-surface-400">to</span>
            <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="px-2 py-1.5 border border-surface-200 rounded-lg text-xs" />
            <button onClick={applyCustom} className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-semibold">Apply</button>
          </div>
        </div>
      )}
    </div>
  );
}
