import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import PageHeader from '../components/PageHeader';
import PeriodPicker from '../components/PeriodPicker';
import MetricCard from '../components/MetricCard';
import DataTable from '../components/DataTable';
import { SkeletonCards, SkeletonTable } from '../components/Skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Receipt, DollarSign, Download, Building } from 'lucide-react';

export default function TaxExportPage() {
  const [period, setPeriod] = useState('ytd');
  const { data, loading } = useApi('/finance/tax-report', { period }, [period]);

  const exportCsv = () => {
    if(!data?.monthly) return;
    const hdr = 'Month,Tax Collected,Revenue,Orders\n';
    const rows = data.monthly.map(m => `${m.month},${m.tax_collected},${m.revenue},${m.orders}`).join('\n');
    const blob = new Blob([hdr+rows],{type:'text/csv'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='tax-report.csv'; a.click();
  };

  return (
    <div>
      <PageHeader title="Sales Tax Report" subtitle="Monthly tax collected — ready for California filing">
        <button onClick={exportCsv} className="flex items-center gap-1 px-3 py-2 bg-surface-100 dark:bg-surface-700 rounded-xl text-xs font-semibold hover:bg-surface-200"><Download size={14}/> Export CSV</button>
        <PeriodPicker value={period} onChange={setPeriod} />
      </PageHeader>

      {loading ? <><SkeletonCards count={2}/><SkeletonTable/></> : (!data?.monthly?.length ? (
        <div className="text-center py-16 text-surface-400 dark:text-surface-500"><Receipt size={48} className="mx-auto mb-4 opacity-30"/><div className="text-lg font-display font-bold mb-2">No tax data yet</div><p className="text-sm">Tax data appears after WooCommerce orders are synced.</p></div>
      ) : (<>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <MetricCard label="Total Tax Collected" value={data?.totalTaxCollected} icon={Receipt} color="bg-red-50 text-red-600" />
          <MetricCard label="Months Reported" value={data?.monthly?.length} format="number" icon={Building} color="bg-blue-50 text-blue-600" />
        </div>

        {data?.monthly?.length > 0 && (
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5 mb-6">
            <h3 className="font-display font-bold text-sm mb-4">Monthly Tax Collected</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.monthly}>
                <XAxis dataKey="month" tick={{fontSize:10}} tickFormatter={v=>v?.slice(5,7)}/>
                <YAxis tick={{fontSize:10}} tickFormatter={v=>'$'+fmt.compact(v)}/>
                <Tooltip formatter={v=>fmt.currency(v)}/><Bar dataKey="tax_collected" fill="#ef4444" name="Tax" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {data?.monthly?.length > 0 && (
          <DataTable columns={[
            {key:'month',label:'Month',render:v=><span className="font-semibold">{v}</span>},
            {key:'tax_collected',label:'Tax Collected',align:'right',render:v=><span className="font-mono font-bold text-red-600">{fmt.currency(v)}</span>},
            {key:'revenue',label:'Revenue',align:'right',render:v=><span className="font-mono">{fmt.currency(v)}</span>},
            {key:'orders',label:'Orders',align:'right',render:v=>fmt.number(v)},
          ]} data={data.monthly} />
        )}
      </>))}
    </div>
  );
}
