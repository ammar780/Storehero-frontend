import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import PageHeader from '../components/PageHeader';
import MetricCard from '../components/MetricCard';
import DataTable from '../components/DataTable';
import { SkeletonCards, SkeletonTable } from '../components/Skeleton';
import { Mail, Eye, MousePointer, AlertTriangle, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import { useToast } from '../components/Toast';

const clean = (v) => String(v || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

function SeriesRow({ campaign, columns }) {
  const [open, setOpen] = useState(false);
  const hasChildren = (campaign.emails || []).length > 0;
  return (
    <>
      <tr className="border-b border-surface-50 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700/40">
        <td className="py-2 pr-4">
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button onClick={() => setOpen(o => !o)} className="text-surface-400 hover:text-surface-600">{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button>
            ) : <span className="w-3.5" />}
            <span className="font-semibold text-sm">{clean(campaign.campaign_name)}</span>
            {hasChildren && <span className="text-[10px] text-surface-400 bg-surface-100 dark:bg-surface-700 px-1.5 py-0.5 rounded-full">{campaign.emails.length} emails</span>}
          </div>
        </td>
        {columns.map((c, i) => <td key={i} className="py-2 pr-4 text-right font-mono text-sm">{c.render(campaign)}</td>)}
      </tr>
      {open && hasChildren && campaign.emails.map((em, i) => (
        <tr key={i} className="border-b border-surface-50 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50">
          <td className="py-2 pr-4 pl-9 text-xs text-surface-500 dark:text-surface-400">{clean(em.campaign_name)}</td>
          {columns.map((c, i2) => <td key={i2} className="py-2 pr-4 text-right font-mono text-xs text-surface-500">{c.render(em)}</td>)}
        </tr>
      ))}
    </>
  );
}

export default function ProviderEmailDetailPage({ provider = 'emailit', title = 'Emailit', accentColor = 'text-indigo-600' }) {
  const toast = useToast();
  const { data, loading, refetch } = useApi(`/emails/${provider}`, {}, [provider]);
  const [syncing, setSyncing] = useState(false);

  const sync = async () => {
    setSyncing(true);
    try {
      const { data: r } = await api.post(`/sync/${provider}`);
      toast.success(r.message || 'Synced');
      refetch();
    } catch (e) { toast.error(e.response?.data?.error || 'Sync failed — check API key in Settings > Integrations'); }
    finally { setSyncing(false); }
  };

  if (loading) return <div><PageHeader title={title} /><SkeletonCards count={4} /><SkeletonTable /></div>;

  const t = data?.totals || {};
  const campaigns = data?.campaigns || [];

  const columns = [
    { label: 'Sent', render: c => fmt.number(c.sent) },
    { label: 'Opened %', render: c => `${c.open_rate}%` },
    { label: 'Clicked %', render: c => `${c.click_rate}%` },
    { label: 'Bounce %', render: c => `${c.bounce_rate}%` },
    { label: 'Revenue', render: c => c.revenue > 0 ? fmt.currency(c.revenue) : '—' },
  ];

  return (
    <div>
      <PageHeader title={`${title} — Every Campaign`} subtitle={`${data?.campaignCount || 0} campaigns · ${data?.totalEmailsInSeries || 0} total emails tracked`}>
        <button onClick={sync} disabled={syncing} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold disabled:opacity-50">
          {syncing ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />} {syncing ? 'Syncing…' : 'Sync Now'}
        </button>
      </PageHeader>

      {campaigns.length === 0 ? (
        <div className="text-center py-16 text-surface-400">
          <Mail size={48} className="mx-auto mb-4 opacity-30" />
          <div className="text-lg font-display font-bold mb-2">No {title} campaigns synced yet</div>
          <p className="text-sm max-w-md mx-auto mb-4">Add your {title} API key in Settings &gt; Integrations, then hit Sync Now above to pull every campaign.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            <MetricCard label="Total Sent" value={t.sent} icon={Mail} color={`bg-surface-50 ${accentColor}`} />
            <MetricCard label="Opened" value={t.opens} format="number" icon={Eye} color="bg-amber-50 text-amber-600" />
            <MetricCard label="Open Rate" value={t.open_rate} format="pct" icon={Eye} color="bg-blue-50 text-blue-600" />
            <MetricCard label="Click Rate" value={t.click_rate} format="pct" icon={MousePointer} color="bg-emerald-50 text-emerald-600" />
            <MetricCard label="Bounce Rate" value={t.bounce_rate} format="pct" icon={AlertTriangle} color="bg-red-50 text-red-600" />
          </div>

          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5">
            <h3 className="font-display font-bold text-sm mb-1">Every Campaign &amp; Autoresponder</h3>
            <p className="text-xs text-surface-400 mb-4">Click a series to expand every individual email inside it — nothing is hidden or summarized away.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] text-surface-400 uppercase tracking-wide border-b border-surface-100 dark:border-surface-700">
                    <th className="pb-2 pr-4 font-semibold">Campaign / Series</th>
                    {columns.map((c, i) => <th key={i} className="pb-2 pr-4 font-semibold text-right">{c.label}</th>)}
                  </tr>
                </thead>
                <tbody>{campaigns.map((c, i) => <SeriesRow key={i} campaign={c} columns={columns} />)}</tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
