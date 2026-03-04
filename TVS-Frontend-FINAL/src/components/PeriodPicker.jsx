export default function PeriodPicker({ value, onChange }) {
  const periods = [{key:'today',label:'Today'},{key:'7d',label:'7D'},{key:'30d',label:'30D'},{key:'90d',label:'90D'},{key:'ytd',label:'YTD'},{key:'12m',label:'12M'}];
  return (
    <div className="inline-flex items-center bg-white rounded-xl border border-surface-200 p-1 shadow-sm">
      {periods.map(p => <button key={p.key} onClick={() => onChange(p.key)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${value===p.key?'bg-brand-900 text-white shadow-sm':'text-surface-500 hover:text-surface-700 hover:bg-surface-50'}`}>{p.label}</button>)}
    </div>
  );
}
