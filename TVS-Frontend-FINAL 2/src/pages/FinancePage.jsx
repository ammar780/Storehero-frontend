import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import PageHeader from '../components/PageHeader';
import PeriodPicker from '../components/PeriodPicker';
import { SkeletonTable } from '../components/Skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function FinancePage() {
  const [period, setPeriod] = useState('90d');
  const [group, setGroup] = useState('month');
  const { data, loading } = useApi('/dashboard/pnl', { period, group }, [period, group]);

  const t = data?.totals;

  return (
    <div>
      <PageHeader title="Profit & Loss" subtitle="Full financial breakdown">
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-white rounded-xl border border-surface-200 p-1 shadow-sm">
            {['day','week','month'].map(g => (
              <button key={g} onClick={() => setGroup(g)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${group===g?'bg-brand-900 text-white':'text-surface-500 hover:text-surface-700'}`}>{g.charAt(0).toUpperCase()+g.slice(1)}</button>
            ))}
          </div>
          <PeriodPicker value={period} onChange={setPeriod} />
        </div>
      </PageHeader>

      {loading ? <SkeletonTable /> : (
        <>
          {/* Totals summary */}
          {t && (
            <div className="bg-white rounded-2xl border border-surface-100 p-6 mb-6">
              <h3 className="font-display font-bold text-surface-800 mb-4">Period Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[
                  ['Revenue', t.revenue, 'text-surface-900'],
                  ['COGS', '-'+fmt.currency(t.cogs), 'text-red-500'],
                  ['Ad Spend', '-'+fmt.currency(t.ad_spend), 'text-purple-600'],
                  ['Net Profit', t.net_profit, +(t.net_profit)>=0?'text-emerald-600':'text-red-600'],
                ].map(([l,v,c]) => (
                  <div key={l}>
                    <div className="text-[11px] text-surface-400 uppercase font-semibold tracking-wider">{l}</div>
                    <div className={`text-xl font-display font-bold mt-1 ${c}`}>{typeof v==='string'?v:fmt.currency(v)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="bg-white rounded-2xl border border-surface-100 p-6 mb-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="period" tick={{fontSize:11,fill:'#a1a1aa'}} tickFormatter={v=>v?.slice(0,10)} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize:11,fill:'#a1a1aa'}} tickFormatter={v=>fmt.compact(v)} axisLine={false} tickLine={false} width={55} />
                <Tooltip contentStyle={{borderRadius:'12px',border:'1px solid #e4e4e7',fontSize:'13px'}} formatter={v=>fmt.currency(v)} />
                <Legend />
                <Bar dataKey="revenue" fill="#22c55e" name="Revenue" radius={[4,4,0,0]} />
                <Bar dataKey="cogs" fill="#f59e0b" name="COGS" radius={[4,4,0,0]} />
                <Bar dataKey="ad_spend" fill="#8b5cf6" name="Ad Spend" radius={[4,4,0,0]} />
                <Bar dataKey="net_profit" fill="#06b6d4" name="Net Profit" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-surface-100">
                  {['Period','Revenue','COGS','Gross Profit','Ad Spend','Shipping','Fees','Fixed Costs','Net Profit','Margin'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-surface-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {(data?.rows||[]).map((r,i) => (
                    <tr key={i} className="border-b border-surface-50 hover:bg-surface-50/50">
                      <td className="px-4 py-3 text-sm font-medium">{r.period?.slice(0,10)}</td>
                      <td className="px-4 py-3 text-sm font-mono">{fmt.currency(r.revenue)}</td>
                      <td className="px-4 py-3 text-sm font-mono text-red-500">-{fmt.currency(r.cogs)}</td>
                      <td className="px-4 py-3 text-sm font-mono">{fmt.currency(r.gross_profit)}</td>
                      <td className="px-4 py-3 text-sm font-mono text-purple-600">-{fmt.currency(r.ad_spend)}</td>
                      <td className="px-4 py-3 text-sm font-mono">-{fmt.currency(r.shipping_cost)}</td>
                      <td className="px-4 py-3 text-sm font-mono">-{fmt.currency(r.payment_fees)}</td>
                      <td className="px-4 py-3 text-sm font-mono">-{fmt.currency(r.fixed_costs)}</td>
                      <td className={`px-4 py-3 text-sm font-mono font-bold ${+(r.net_profit)>=0?'text-emerald-600':'text-red-500'}`}>{fmt.currency(r.net_profit)}</td>
                      <td className="px-4 py-3 text-sm">{(+(r.net_margin_pct)||0).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
