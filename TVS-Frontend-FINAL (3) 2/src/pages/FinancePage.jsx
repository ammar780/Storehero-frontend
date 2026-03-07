import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import api from '../utils/api';
import PageHeader from '../components/PageHeader';
import PeriodPicker from '../components/PeriodPicker';
import { SkeletonTable, SkeletonChart } from '../components/Skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';

function CompRow({ label, curr, prev, indent, bold, border }) {
  const c = +(curr) || 0, p = +(prev) || 0;
  const ch = p !== 0 ? ((c - p) / Math.abs(p) * 100) : 0;
  const positive = label.includes('Profit') || label === 'Revenue' || label === 'Gross Margin';
  const better = positive ? c >= p : c <= p;
  return (
    <tr className={`${border ? 'border-t-2 border-surface-200' : 'border-b border-surface-50'} ${bold ? 'font-bold' : ''}`}>
      <td className={`py-2.5 px-4 text-sm ${indent ? 'pl-8' : ''} ${bold ? 'text-surface-900 font-display' : 'text-surface-600'}`}>{label}</td>
      <td className="py-2.5 px-4 text-right font-mono text-sm">{fmt.currencyExact(c)}</td>
      <td className="py-2.5 px-4 text-right font-mono text-sm text-surface-400">{fmt.currencyExact(p)}</td>
      <td className={`py-2.5 px-4 text-right text-xs font-semibold ${Math.abs(ch) < 1 ? 'text-surface-400' : better ? 'text-emerald-600' : 'text-red-500'}`}>
        {Math.abs(ch) < 0.1 ? '—' : `${ch > 0 ? '+' : ''}${ch.toFixed(1)}%`}
      </td>
    </tr>
  );
}

export default function FinancePage() {
  const [period, setPeriod] = useState('30d');
  const [tab, setTab] = useState('pnl');
  const { data: comp, loading: lc } = useApi('/dashboard/pnl-comparison', { period }, [period]);
  const { data: waterfall, loading: lw } = useApi('/dashboard/waterfall', { period }, [period]);
  const { data: pnl, loading: lp } = useApi('/dashboard/pnl', { period, group: 'month' }, [period]);

  const exportCsv = async () => {
    try {
      const resp = await api.get('/dashboard/pnl-csv', { params: { period }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement('a'); a.href = url; a.download = `TVS_PnL_${period}.csv`; document.body.appendChild(a); a.click(); a.remove();
    } catch (e) { console.error(e); }
  };

  const c = comp?.current || {}, p = comp?.previous || {};

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <PageHeader title="Profit & Loss" subtitle="Full financial breakdown with period comparison" />
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-white rounded-xl border border-surface-200 p-0.5">
            {[['pnl','P&L'],['waterfall','Waterfall']].map(([k,l]) => (
              <button key={k} onClick={() => setTab(k)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab===k?'bg-brand-500 text-white':'text-surface-500'}`}>{l}</button>
            ))}
          </div>
          <PeriodPicker value={period} onChange={setPeriod} />
          <button onClick={exportCsv} className="flex items-center gap-2 px-3 py-2 bg-surface-800 hover:bg-surface-900 text-white rounded-xl text-xs font-semibold transition-all"><Download size={14} /> Export</button>
        </div>
      </div>

      {tab === 'pnl' && (
        <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-100 flex items-center justify-between">
            <span className="text-sm font-display font-bold text-surface-800">Period Comparison</span>
            <span className="text-xs text-surface-400">Current vs Previous {period}</span>
          </div>
          {lc ? <SkeletonTable /> : (
            <table className="w-full">
              <thead><tr className="border-b border-surface-100 bg-surface-50/50">
                <th className="py-2 px-4 text-left text-[10px] font-semibold text-surface-400 uppercase">Line Item</th>
                <th className="py-2 px-4 text-right text-[10px] font-semibold text-surface-400 uppercase">Current</th>
                <th className="py-2 px-4 text-right text-[10px] font-semibold text-surface-400 uppercase">Previous</th>
                <th className="py-2 px-4 text-right text-[10px] font-semibold text-surface-400 uppercase">Change</th>
              </tr></thead>
              <tbody>
                <CompRow label="Revenue" curr={c.revenue} prev={p.revenue} bold />
                <CompRow label="Product COGS" curr={c.cogs} prev={p.cogs} indent />
                <CompRow label="Shipping Costs" curr={c.shipping} prev={p.shipping} indent />
                <CompRow label="Payment Fees" curr={c.fees} prev={p.fees} indent />
                <CompRow label="Discounts" curr={c.discounts} prev={p.discounts} indent />
                <CompRow label="Refunds" curr={c.refunds} prev={p.refunds} indent />
                <CompRow label="Gross Profit" curr={c.gross_profit} prev={p.gross_profit} bold border />
                <CompRow label="Ad Spend" curr={c.ad_spend} prev={p.ad_spend} indent />
                <CompRow label="Fixed Costs" curr={c.fixed_costs} prev={p.fixed_costs} indent />
                <CompRow label="Net Profit" curr={c.net_profit} prev={p.net_profit} bold border />
                <CompRow label="Orders" curr={c.orders} prev={p.orders} />
                <CompRow label="New Customers" curr={c.new_customers} prev={p.new_customers} />
                <CompRow label="CAC" curr={c.cac} prev={p.cac} />
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'waterfall' && (
        <div className="bg-white rounded-2xl border border-surface-100 p-5">
          <h3 className="font-display font-bold text-surface-800 text-sm mb-4">Contribution Margin Waterfall</h3>
          {lw ? <SkeletonChart /> : waterfall?.length > 0 ? (
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={waterfall} layout="vertical" margin={{ left: 100, right: 20 }}>
                <XAxis type="number" tickFormatter={v => fmt.compact(v)} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip formatter={v => fmt.currencyExact(v)} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {(waterfall || []).map((entry, i) => (
                    <Cell key={i} fill={entry.type === 'positive' || entry.type === 'subtotal' ? '#f1c349' : entry.type === 'total' ? (entry.value >= 0 ? '#16a34a' : '#dc2626') : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[360px] flex items-center justify-center text-surface-400">No data for this period</div>}
        </div>
      )}
    </div>
  );
}
