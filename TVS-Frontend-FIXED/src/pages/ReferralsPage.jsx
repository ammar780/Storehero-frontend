import { useState } from 'react';
import api, { fmt } from '../utils/api';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import PeriodPicker from '../components/PeriodPicker';
import MetricCard from '../components/MetricCard';
import DataTable from '../components/DataTable';
import { SkeletonCards, SkeletonTable } from '../components/Skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, DollarSign, TrendingUp, Gift, RefreshCw, Link2, MousePointer, ShoppingCart } from 'lucide-react';

export default function ReferralsPage() {
  const [period, setPeriod] = useState('12m');
  const [tab, setTab] = useState('overview');
  const { data, loading, error, refetch } = useApi('/referrals/overview', { period }, [period]);
  const toast = useToast();
  const [syncing, setSyncing] = useState({});

  const doSync = async (endpoint, label) => {
    setSyncing(s => ({ ...s, [endpoint]: true }));
    try {
      const { data: d } = await api.post(endpoint);
      toast.success(d.message || `${label} synced!`);
      refetch();
    } catch (e) { toast.error(e.response?.data?.error || e.message); }
    finally { setSyncing(s => ({ ...s, [endpoint]: false })); }
  };

  const aff = data?.affiliates || {};
  const sales = data?.sales || {};
  const credits = data?.storeCredits || {};
  const impact = data?.pnlImpact || {};

  const affCols = [
    { key: 'name', label: 'Affiliate', render: (v, r) => <div><div className="font-medium text-sm">{v || 'Unknown'}</div><div className="text-xs text-surface-400">{r.email}</div></div> },
    { key: 'total_referrals', label: 'Referrals', align: 'right', render: v => fmt.number(v) },
    { key: 'total_clicks', label: 'Clicks', align: 'right', render: v => fmt.number(v) },
    { key: 'commission_rate', label: 'Rate', align: 'right', render: v => v + '%' },
    { key: 'total_earned', label: 'Earned', align: 'right', render: v => <span className="font-bold text-red-600">{fmt.currency(v)}</span> },
    { key: 'status', label: 'Status', render: v => <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${v === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-surface-100 text-surface-400'}`}>{v}</span> },
  ];

  const saleCols = [
    { key: 'affiliate_name', label: 'Affiliate', render: v => <span className="font-medium text-sm">{v || 'Unknown'}</span> },
    { key: 'customer_name', label: 'Customer', render: (v, r) => <div><div className="text-sm">{v}</div><div className="text-xs text-surface-400">{r.customer_email}</div></div> },
    { key: 'total_earned', label: 'Commission', align: 'right', render: v => <span className="font-semibold text-red-600">{fmt.currencyExact(v)}</span> },
    { key: 'commission_rate', label: 'Rate', align: 'right', render: v => v + '%' },
    { key: 'created_at', label: 'Date', render: v => v ? new Date(v).toLocaleDateString() : '--' },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <PageHeader title="Referrals & Affiliates" subtitle="Store credits, affiliate commissions, and their P&L impact" />
        <div className="flex items-center gap-2">
          <PeriodPicker value={period} onChange={setPeriod} />
        </div>
      </div>

      {/* Sync buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => doSync('/sync/referly', 'Referly')} disabled={syncing['/sync/referly']}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50">
          <RefreshCw size={14} className={syncing['/sync/referly'] ? 'animate-spin' : ''} /> {syncing['/sync/referly'] ? 'Syncing...' : 'Sync Referly Affiliates'}
        </button>
        <button onClick={() => doSync('/sync/store-credits', 'Store Credits')} disabled={syncing['/sync/store-credits']}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50">
          <RefreshCw size={14} className={syncing['/sync/store-credits'] ? 'animate-spin' : ''} /> {syncing['/sync/store-credits'] ? 'Syncing...' : 'Sync Store Credits'}
        </button>
      </div>

      {/* Tab selector */}
      <div className="inline-flex bg-white dark:bg-surface-800 rounded-xl border border-surface-200 p-1 mb-6">
        {[['overview', 'Overview'], ['affiliates', 'Affiliates'], ['credits', 'Store Credits']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${tab === k ? 'bg-brand-500 text-white' : 'text-surface-500'}`}>{l}</button>
        ))}
      </div>

      {loading ? <><SkeletonCards count={4} /><SkeletonTable /></> : (
        <>
          {tab === 'overview' && (
            <div>
              {/* P&L Impact banner */}
              <div className="bg-gradient-to-r from-red-50 to-amber-50 dark:from-red-900/20 dark:to-amber-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-5 mb-6">
                <h3 className="font-display font-bold text-surface-800 dark:text-surface-200 text-sm mb-3">P&L Impact This Period</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-xs text-surface-400 uppercase tracking-wider mb-1">Affiliate Commissions</div>
                    <div className="text-2xl font-display font-bold text-red-600">-{fmt.currency(impact.total_affiliate_cost)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-surface-400 uppercase tracking-wider mb-1">Store Credits Used</div>
                    <div className="text-2xl font-display font-bold text-amber-600">-{fmt.currency(impact.total_credit_cost)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-surface-400 uppercase tracking-wider mb-1">Total Cost</div>
                    <div className="text-2xl font-display font-bold text-red-700">-{fmt.currency((+(impact.total_affiliate_cost)||0) + (+(impact.total_credit_cost)||0))}</div>
                  </div>
                </div>
              </div>

              {/* Metric cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 stagger">
                <MetricCard label="Total Affiliates" value={aff.total_affiliates} format="number" icon={Users} color="bg-purple-50 text-purple-600" />
                <MetricCard label="Total Commissions" value={aff.total_commissions} format="currency" icon={DollarSign} color="bg-red-50 text-red-600" />
                <MetricCard label="Total Referrals" value={aff.total_referrals} format="number" icon={Link2} color="bg-blue-50 text-blue-600" />
                <MetricCard label="Store Credits Used" value={credits.total_credits_used} format="currency" icon={Gift} color="bg-amber-50 text-amber-600" />
              </div>

              {/* Recent affiliate sales */}
              {sales.recent?.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-display font-bold text-surface-800 dark:text-surface-200 mb-4">Recent Affiliate Sales</h3>
                  <DataTable columns={saleCols} data={sales.recent} />
                </div>
              )}

              {/* Store credit by month chart */}
              {credits.byMonth?.length > 0 && (
                <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5 mt-6">
                  <h3 className="font-display font-bold text-surface-800 dark:text-surface-200 text-sm mb-4">Store Credits Used by Month</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={credits.byMonth}>
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={v => v?.slice(5, 7)} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => '$' + fmt.compact(v)} />
                      <Tooltip formatter={v => fmt.currency(v)} />
                      <Bar dataKey="credits_used" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Credits Used" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {tab === 'affiliates' && (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <MetricCard label="Affiliates" value={aff.total_affiliates} format="number" icon={Users} />
                <MetricCard label="Total Earned" value={aff.total_commissions} format="currency" icon={DollarSign} color="bg-red-50 text-red-600" />
                <MetricCard label="Total Clicks" value={aff.total_clicks} format="number" icon={MousePointer} />
                <MetricCard label="Period Sales" value={sales.sales_count} format="number" icon={ShoppingCart} />
              </div>
              {aff.topAffiliates?.length > 0 ? (
                <DataTable columns={affCols} data={aff.topAffiliates} searchable={['name', 'email']} />
              ) : (
                <div className="text-center py-16 text-surface-400">
                  <Users size={48} className="mx-auto mb-4 opacity-30" />
                  <div className="text-lg font-display font-bold mb-2">No affiliate data yet</div>
                  <p className="text-sm">Click "Sync Referly Affiliates" to pull data from your affiliate program.</p>
                </div>
              )}
            </div>
          )}

          {tab === 'credits' && (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <MetricCard label="Credits Used" value={credits.total_credits_used} format="currency" icon={Gift} color="bg-amber-50 text-amber-600" />
                <MetricCard label="Orders w/ Credits" value={credits.orders_with_credits} format="number" icon={ShoppingCart} />
                <MetricCard label="Total Issued (All Time)" value={credits.ledger?.total_issued} format="currency" icon={TrendingUp} />
                <MetricCard label="Unique Customers" value={credits.ledger?.unique_customers} format="number" icon={Users} />
              </div>

              {credits.byMonth?.length > 0 ? (
                <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 overflow-hidden">
                  <div className="px-5 py-3 border-b border-surface-100">
                    <h3 className="font-display font-bold text-surface-800 dark:text-surface-200 text-sm">Monthly Store Credit Usage</h3>
                  </div>
                  <table className="w-full">
                    <thead><tr className="border-b border-surface-100 bg-surface-50/50">
                      <th className="py-2 px-5 text-left text-[10px] font-semibold text-surface-400 uppercase">Month</th>
                      <th className="py-2 px-5 text-right text-[10px] font-semibold text-surface-400 uppercase">Credits Used</th>
                      <th className="py-2 px-5 text-right text-[10px] font-semibold text-surface-400 uppercase">Orders</th>
                    </tr></thead>
                    <tbody>
                      {credits.byMonth.map((m, i) => (
                        <tr key={i} className="border-b border-surface-50">
                          <td className="py-3 px-5 text-sm font-medium">{m.month}</td>
                          <td className="py-3 px-5 text-sm text-right font-mono text-amber-600">{fmt.currency(m.credits_used)}</td>
                          <td className="py-3 px-5 text-sm text-right">{m.credit_orders}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 text-surface-400">
                  <Gift size={48} className="mx-auto mb-4 opacity-30" />
                  <div className="text-lg font-display font-bold mb-2">No store credit data yet</div>
                  <p className="text-sm">Click "Sync Store Credits" to pull credit usage from your WooCommerce orders.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
