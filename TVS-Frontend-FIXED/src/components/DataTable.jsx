import { useState } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
export default function DataTable({ columns, data, searchable, onRowClick, emptyMessage = 'No data found' }) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('desc');
  const [search, setSearch] = useState('');
  let rows = data || [];
  if (search && searchable) { const q = search.toLowerCase(); rows = rows.filter(r => searchable.some(k => String(r[k]||'').toLowerCase().includes(q))); }
  if (sortCol) { rows = [...rows].sort((a, b) => { const va = a[sortCol], vb = b[sortCol]; const cmp = typeof va === 'number' ? va - vb : String(va||'').localeCompare(String(vb||'')); return sortDir === 'asc' ? cmp : -cmp; }); }
  const toggleSort = (key) => { if (sortCol === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(key); setSortDir('desc'); } };
  return (
    <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
      {searchable && <div className="px-5 py-3 border-b border-surface-100"><div className="relative max-w-xs"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-4 py-2 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" /></div></div>}
      <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-surface-100">{columns.map(col => <th key={col.key} onClick={() => col.sortable !== false && toggleSort(col.key)} className={`px-5 py-3 text-left text-[11px] font-semibold text-surface-400 uppercase tracking-wider ${col.sortable !== false ? 'cursor-pointer hover:text-surface-600 select-none' : ''} ${col.align === 'right' ? 'text-right' : ''}`}><div className="flex items-center gap-1">{col.label}{sortCol === col.key && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}</div></th>)}</tr></thead>
      <tbody>{rows.length === 0 ? <tr><td colSpan={columns.length} className="px-5 py-12 text-center text-surface-400 text-sm">{emptyMessage}</td></tr> : rows.map((row, i) => <tr key={i} onClick={() => onRowClick?.(row)} className={`border-b border-surface-50 last:border-0 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-brand-50/30' : 'hover:bg-surface-50/50'}`}>{columns.map(col => <td key={col.key} className={`px-5 py-3.5 text-sm ${col.align === 'right' ? 'text-right' : ''}`}>{col.render ? col.render(row[col.key], row) : row[col.key]}</td>)}</tr>)}</tbody></table></div>
    </div>
  );
}
