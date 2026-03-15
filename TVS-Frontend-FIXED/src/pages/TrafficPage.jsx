import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import PageHeader from '../components/PageHeader';
import PeriodPicker from '../components/PeriodPicker';
import MetricCard from '../components/MetricCard';
import DataTable from '../components/DataTable';
import { SkeletonCards, SkeletonTable } from '../components/Skeleton';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Globe, Users, ShoppingCart, TrendingUp, MapPin } from 'lucide-react';

const COLORS = ['#f1c349','#6366f1','#22c55e','#ef4444','#3b82f6','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316'];

export default function TrafficPage() {
  const [period, setPeriod] = useState('30d');
  const [tab, setTab] = useState('overview');
  const { data, loading } = useApi('/analytics/traffic', { period }, [period]);
  const s = data?.summary || {};

  return (
    <div>
      <PageHeader title="Website Traffic" subtitle="Traffic sources, customer acquisition, and geographic breakdown">
        <PeriodPicker value={period} onChange={setPeriod} />
      </PageHeader>

      {/* Tab selector */}
      <div className="inline-flex bg-white dark:bg-surface-800 rounded-xl border border-surface-200 p-1 mb-6">
        {[['overview','Overview'],['sources','Sources'],['geography','Geography']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${tab===k?'bg-brand-500 text-white':'text-surface-500 hover:text-surface-700'}`}>{l}</button>
        ))}
      </div>

      {loading ? <><SkeletonCards count={4}/><SkeletonTable/></> : (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6 stagger">
            <MetricCard label="Total Orders" value={s.total_orders} format="number" icon={ShoppingCart} color="bg-purple-50 text-purple-600" />
            <MetricCard label="Unique Customers" value={s.unique_customers} format="number" icon={Users} color="bg-blue-50 text-blue-600" />
            <MetricCard label="New Customers" value={s.new_customers} format="number" icon={TrendingUp} color="bg-emerald-50 text-emerald-600" />
            <MetricCard label="Revenue" value={s.revenue} icon={ShoppingCart} color="bg-amber-50 text-amber-600" />
            <MetricCard label="Traffic Sources" value={s.traffic_sources} format="number" icon={Globe} color="bg-indigo-50 text-indigo-600" />
          </div>

          {tab === 'overview' && (
            <div className="space-y-6">
              {/* Daily orders trend */}
              {data?.daily?.length > 0 && (
                <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
                  <h3 className="font-display font-bold text-surface-800 dark:text-surface-200 text-sm mb-4">Daily Orders</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={data.daily}>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v?.slice(5)} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v, name) => [name === 'revenue' ? fmt.currency(v) : v, name]} />
                      <Area type="monotone" dataKey="orders" stroke="#f1c349" fill="#f1c34930" strokeWidth={2} name="Orders" />
                      <Area type="monotone" dataKey="unique_customers" stroke="#6366f1" fill="#6366f120" strokeWidth={2} name="Unique Customers" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* New vs Returning */}
              {data?.newVsReturn?.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
                    <h3 className="font-display font-bold text-surface-800 dark:text-surface-200 text-sm mb-4">New vs Returning</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={data.newVsReturn} dataKey="orders" nameKey="type" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {data.newVsReturn.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={v => fmt.number(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
                    <h3 className="font-display font-bold text-surface-800 dark:text-surface-200 text-sm mb-4">Customer Type Breakdown</h3>
                    <div className="space-y-4 mt-6">
                      {data.newVsReturn.map((r, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                          <div>
                            <div className="font-semibold text-sm">{r.type} Customers</div>
                            <div className="text-xs text-surface-400">{fmt.number(r.orders)} orders</div>
                          </div>
                          <div className="text-right">
                            <div className="font-display font-bold text-brand-700">{fmt.currency(r.revenue)}</div>
                            <div className="text-xs text-surface-400">AOV: {fmt.currency(r.aov)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'sources' && (
            <div className="space-y-6">
              {/* Traffic sources chart */}
              {data?.sources?.length > 0 && (
                <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
                  <h3 className="font-display font-bold text-surface-800 dark:text-surface-200 text-sm mb-4">Revenue by Source</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.sources.slice(0, 10)} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => '$' + fmt.compact(v)} />
                      <YAxis type="category" dataKey="source" tick={{ fontSize: 11 }} width={100} />
                      <Tooltip formatter={v => fmt.currency(v)} />
                      <Bar dataKey="revenue" fill="#f1c349" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <DataTable 
                columns={[
                  { key: 'source', label: 'Source', render: v => <span className="font-semibold text-sm">{v || 'direct'}</span> },
                  { key: 'medium', label: 'Medium', render: v => <span className="text-xs px-2 py-0.5 rounded-full bg-surface-100 text-surface-500">{v}</span> },
                  { key: 'orders', label: 'Orders', align: 'right', render: v => fmt.number(v) },
                  { key: 'customers', label: 'Customers', align: 'right', render: v => fmt.number(v) },
                  { key: 'revenue', label: 'Revenue', align: 'right', render: v => <span className="font-mono font-semibold">{fmt.currency(v)}</span> },
                  { key: 'aov', label: 'AOV', align: 'right', render: v => fmt.currency(v) },
                ]}
                data={data?.sources || []}
                searchable={['source','medium']}
              />
            </div>
          )}

          {tab === 'geography' && (
            <div className="space-y-6">
              {data?.countries?.length > 0 && (
                <>
                  <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
                    <h3 className="font-display font-bold text-surface-800 dark:text-surface-200 text-sm mb-4">Revenue by Country</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={data.countries.slice(0, 10)}>
                        <XAxis dataKey="country" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={v => '$' + fmt.compact(v)} />
                        <Tooltip formatter={v => fmt.currency(v)} />
                        <Bar dataKey="revenue" fill="#6366f1" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <DataTable
                    columns={[
                      { key: 'country', label: 'Country', render: v => <span className="font-semibold text-sm flex items-center gap-2"><MapPin size={14} className="text-surface-400" />{v}</span> },
                      { key: 'customers', label: 'Customers', align: 'right', render: v => fmt.number(v) },
                      { key: 'orders', label: 'Orders', align: 'right', render: v => fmt.number(v) },
                      { key: 'revenue', label: 'Revenue', align: 'right', render: v => <span className="font-mono font-bold text-brand-700">{fmt.currency(v)}</span> },
                    ]}
                    data={data?.countries || []}
                    searchable={['country']}
                  />
                </>
              )}
              {(!data?.countries || data.countries.length === 0) && (
                <div className="text-center py-16 text-surface-400">
                  <Globe size={48} className="mx-auto mb-4 opacity-30" />
                  <div className="text-lg font-display font-bold mb-2">No geographic data yet</div>
                  <p className="text-sm">Sync your WooCommerce orders to see customer locations.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
