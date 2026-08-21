import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import PageHeader from '../components/PageHeader';
import PeriodPicker from '../components/PeriodPicker';
import MetricCard from '../components/MetricCard';
import DataTable from '../components/DataTable';
import { SkeletonCards, SkeletonTable } from '../components/Skeleton';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign, CreditCard, AlertTriangle, ArrowRightLeft, TrendingUp, Shield } from 'lucide-react';

export default function ReconciliationPage() {
  const [period, setPeriod] = useState('30d');
  const { data, loading , error } = useApi('/finance/reconciliation', { period }, [period]);
  const { data: balances } = useApi('/finance/balances', {}, []);
  const t = data?.totals || {};
  const accts = data?.accounts || {};

  return (
    <div>
      <PageHeader title="Payment Reconciliation" subtitle="Track money from WooCommerce through Elavon & PayPal to your bank">
        <PeriodPicker value={period} onChange={setPeriod} />
      </PageHeader>

      {loading ? <><SkeletonCards count={4} /><SkeletonTable /></> : (
        <div className="space-y-6">
          {/* Alert banner */}
          {data?.alert && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div><div className="font-semibold text-amber-800 dark:text-amber-200 text-sm">Discrepancy Detected</div><p className="text-amber-700 dark:text-amber-300 text-xs mt-1">{data.alert}</p></div>
            </div>
          )}

          {/* Real-time Account Balances */}
          {balances && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 mb-6">
              {balances.paypal && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center"><DollarSign size={20} className="text-white" /></div>
                    <div><h3 className="font-display font-bold">PayPal Balance</h3><p className="text-xs text-surface-400">{balances.paypal.source === 'paypal_api' ? 'Live from PayPal API' : 'Calculated from orders'}</p></div>
                  </div>
                  <div className="text-3xl font-display font-bold text-blue-700 dark:text-blue-400 mb-2">{fmt.currency(balances.paypal.available)}</div>
                  {+(balances.paypal.pending||0) > 0 && <div className="text-sm text-blue-500">+ {fmt.currency(balances.paypal.pending)} pending</div>}
                </div>
              )}
              {balances.elavon && (
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center"><CreditCard size={20} className="text-white" /></div>
                    <div><h3 className="font-display font-bold">Elavon (Credit Cards)</h3><p className="text-xs text-surface-400">Calculated from orders (last 30 days)</p></div>
                  </div>
                  <div className="text-3xl font-display font-bold text-indigo-700 dark:text-indigo-400 mb-2">{fmt.currency(balances.elavon.total_expected)}</div>
                  <div className="flex gap-4 mt-2">
                    <div className="text-sm"><span className="text-surface-400">Deposited:</span> <span className="font-semibold text-emerald-600">{fmt.currency(balances.elavon.deposited)}</span></div>
                    <div className="text-sm"><span className="text-surface-400">Pending:</span> <span className="font-semibold text-amber-600">{fmt.currency(balances.elavon.pending)}</span></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 stagger">
            <MetricCard label="WooCommerce Revenue" value={t.total_revenue} icon={DollarSign} color="bg-purple-50 text-purple-600" />
            <MetricCard label="Processing Fees" value={t.total_fees} icon={CreditCard} color="bg-red-50 text-red-600" />
            <MetricCard label="Refunds" value={t.total_refunds} icon={ArrowRightLeft} color="bg-amber-50 text-amber-600" />
            <MetricCard label="Store Credits" value={t.store_credits} icon={Shield} color="bg-blue-50 text-blue-600" />
            <MetricCard label="Expected Deposits" value={t.expected_deposits} icon={TrendingUp} color="bg-emerald-50 text-emerald-600" />
          </div>

          {/* Elavon vs PayPal comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:p-6">
            {/* Elavon */}
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center"><CreditCard size={20} className="text-indigo-600" /></div>
                <div><h3 className="font-display font-bold text-surface-800 dark:text-surface-200">Elavon (Credit Cards)</h3><p className="text-xs text-surface-400">{accts.elavon?.orders||0} orders · Transfer: {accts.elavon?.transferDays || '1-2 days'}</p></div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-surface-100"><span className="text-sm text-surface-500">Revenue Collected</span><span className="font-mono font-bold">{fmt.currency(accts.elavon?.revenue)}</span></div>
                <div className="flex justify-between py-2 border-b border-surface-100"><span className="text-sm text-surface-500">Processing Fees</span><span className="font-mono text-red-500">-{fmt.currency(accts.elavon?.fees)}</span></div>
                <div className="flex justify-between py-2"><span className="text-sm font-semibold">Expected Deposit</span><span className="font-mono font-bold text-emerald-600">{fmt.currency(accts.elavon?.expectedDeposit)}</span></div>
              </div>
            </div>

            {/* PayPal */}
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><DollarSign size={20} className="text-blue-600" /></div>
                <div><h3 className="font-display font-bold text-surface-800 dark:text-surface-200">PayPal</h3><p className="text-xs text-surface-400">{accts.paypal?.orders||0} orders · Transfer: {accts.paypal?.transferDays || '1-3 days'}</p></div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-surface-100"><span className="text-sm text-surface-500">Revenue Collected</span><span className="font-mono font-bold">{fmt.currency(accts.paypal?.revenue)}</span></div>
                <div className="flex justify-between py-2 border-b border-surface-100"><span className="text-sm text-surface-500">Processing Fees</span><span className="font-mono text-red-500">-{fmt.currency(accts.paypal?.fees)}</span></div>
                <div className="flex justify-between py-2"><span className="text-sm font-semibold">Expected Deposit</span><span className="font-mono font-bold text-emerald-600">{fmt.currency(accts.paypal?.expectedDeposit)}</span></div>
              </div>
            </div>
          </div>

          {/* Combined total */}
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5">
            <h3 className="font-display font-bold text-surface-800 dark:text-surface-200 text-sm mb-3">Total Expected in Your Bank Accounts</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
              <div><div className="text-xs text-surface-400 uppercase">Elavon</div><div className="text-xl font-display font-bold text-indigo-600">{fmt.currency(accts.elavon?.expectedDeposit)}</div></div>
              <div><div className="text-xs text-surface-400 uppercase">PayPal</div><div className="text-xl font-display font-bold text-blue-600">{fmt.currency(accts.paypal?.expectedDeposit)}</div></div>
              <div><div className="text-xs text-surface-400 uppercase">Combined</div><div className="text-xl font-display font-bold text-emerald-600">{fmt.currency((+(accts.elavon?.expectedDeposit)||0) + (+(accts.paypal?.expectedDeposit)||0))}</div></div>
            </div>
          </div>

          {/* Daily deposits chart */}
          {data?.daily?.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
              <h3 className="font-display font-bold text-surface-800 dark:text-surface-200 text-sm mb-4">Daily Revenue & Expected Deposits</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.daily}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v?.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => '$' + fmt.compact(v)} />
                  <Tooltip formatter={v => fmt.currency(v)} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="#8b5cf620" strokeWidth={2} name="Revenue" />
                  <Area type="monotone" dataKey="net_deposits" stroke="#22c55e" fill="#22c55e20" strokeWidth={2} name="Net Deposits" />
                  <Area type="monotone" dataKey="fees" stroke="#ef4444" fill="#ef444420" strokeWidth={1} name="Fees" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* By payment method table */}
          {/* Payment methods detected */}
          {data?.paymentMethods?.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5 mb-6">
              <h3 className="font-display font-bold text-surface-800 dark:text-surface-200 text-sm mb-3">Payment Methods Detected in WooCommerce</h3>
              <div className="flex flex-wrap gap-2">
                {(data?.paymentMethods||[]).map((m,i) => (
                  <span key={i} className="px-3 py-1.5 bg-surface-100 dark:bg-surface-700 rounded-lg text-xs font-mono">
                    {m.payment_method || 'empty'} <span className="text-surface-400">({m.cnt})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {data?.byMethod?.length > 0 && (
            <div>
              <h3 className="font-display font-bold text-surface-800 dark:text-surface-200 text-sm mb-3">Breakdown by Payment Method</h3>
              <DataTable
                columns={[
                  { key: 'method', label: 'Payment Method', render: v => <span className="font-semibold text-sm capitalize">{(v||'unknown').replace(/_/g,' ')}</span> },
                  { key: 'orders', label: 'Orders', align: 'right', render: v => fmt.number(v) },
                  { key: 'revenue', label: 'Revenue', align: 'right', render: v => <span className="font-mono">{fmt.currency(v)}</span> },
                  { key: 'fees', label: 'Fees', align: 'right', render: v => <span className="font-mono text-red-500">-{fmt.currency(v)}</span> },
                  { key: 'refunds', label: 'Refunds', align: 'right', render: v => <span className="font-mono text-amber-500">-{fmt.currency(v)}</span> },
                ]}
                data={data.byMethod}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
