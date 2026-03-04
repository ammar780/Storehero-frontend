import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import api from '../utils/api';
import PageHeader from '../components/PageHeader';
import { SkeletonTable } from '../components/Skeleton';
import { RefreshCw, Plus, Trash2, Wifi, WifiOff, Bell, Mail, FileSpreadsheet, Download } from 'lucide-react';

function Tab({ tabs, active, onChange }) {
  return (
    <div className="inline-flex bg-white rounded-xl border border-surface-200 p-1 shadow-sm mb-6 flex-wrap">
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${active===t.key?'bg-brand-900 text-white':'text-surface-500 hover:text-surface-700'}`}>{t.label}</button>
      ))}
    </div>
  );
}

function SyncBtn({ label, onClick, loading, color = 'bg-brand-600 hover:bg-brand-700' }) {
  return (
    <button onClick={onClick} disabled={loading} className={`flex items-center gap-2 px-4 py-2.5 ${color} text-white rounded-xl text-sm font-semibold transition-all shadow-sm disabled:opacity-50`}>
      <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> {loading ? 'Syncing...' : label}
    </button>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState('integrations');
  const { data: integrations, loading: li, refetch: ri } = useApi('/settings/integrations');
  const { data: costsData, loading: lc, refetch: rc } = useApi('/settings/fixed-costs');
  const { data: alerts, loading: la } = useApi('/settings/alerts');
  const { data: reports } = useApi('/settings/reports');

  const [syncing, setSyncing] = useState({});
  const [addingCost, setAddingCost] = useState(false);
  const [costForm, setCostForm] = useState({ name: '', amount_monthly: '', category: '' });

  const doSync = async (key, endpoint, body = {}) => {
    setSyncing(s => ({ ...s, [key]: true }));
    try {
      const { data } = await api.post(endpoint, body);
      alert(data.message || data.status || 'Sync complete!');
      ri();
    } catch (e) { alert('Error: ' + (e.response?.data?.error || e.message)); }
    finally { setSyncing(s => ({ ...s, [key]: false })); }
  };

  const addCost = async () => {
    if (!costForm.name || !costForm.amount_monthly) return;
    await api.post('/settings/fixed-costs', { ...costForm, amount_monthly: +costForm.amount_monthly });
    setCostForm({ name: '', amount_monthly: '', category: '' }); setAddingCost(false); rc();
  };

  const delCost = async (id) => { await api.delete('/settings/fixed-costs/' + id); rc(); };

  const tabs = [
    { key: 'integrations', label: 'Integrations' },
    { key: 'sync', label: 'Sync & Import' },
    { key: 'costs', label: 'Fixed Costs' },
    { key: 'reports', label: 'Reports & Email' },
    { key: 'alerts', label: 'Alerts' },
  ];

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage integrations, syncing, costs, reports, and alerts" />
      <Tab tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'integrations' && (
        <div>
          {li ? <SkeletonTable /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
              {(integrations||[]).map(int => (
                <div key={int.id} className={`bg-white rounded-2xl border p-5 transition-all hover:shadow-cardHover ${int.is_connected ? 'border-emerald-200' : 'border-surface-100'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-display font-bold text-surface-800 capitalize">{int.platform.replace(/_/g, ' ')}</h4>
                    {int.is_connected ? <Wifi size={16} className="text-emerald-500" /> : <WifiOff size={16} className="text-surface-300" />}
                  </div>
                  <div className="space-y-1.5 text-xs text-surface-500">
                    <div>Status: <span className={`font-semibold ${int.is_connected?'text-emerald-600':'text-surface-400'}`}>{int.is_connected?'Connected':'Not connected'}</span></div>
                    {int.last_sync_at && <div>Last sync: {new Date(int.last_sync_at).toLocaleString()}</div>}
                    {int.sync_status && int.sync_status !== 'idle' && <div>Sync: <span className="capitalize font-semibold">{int.sync_status}</span></div>}
                    {int.error_message && <div className="text-red-500 truncate">{int.error_message}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'sync' && (
        <div className="space-y-6 stagger">
          <div className="bg-white rounded-2xl border border-surface-100 p-6">
            <h3 className="font-display font-bold text-surface-800 mb-1">WooCommerce Full Sync</h3>
            <p className="text-xs text-surface-400 mb-4">Pulls all products, orders, customers. Rebuilds daily metrics and product stats.</p>
            <SyncBtn label="Run Full WooCommerce Sync" onClick={() => doSync('woo', '/sync/woocommerce')} loading={syncing.woo} />
          </div>

          <div className="bg-white rounded-2xl border border-surface-100 p-6">
            <h3 className="font-display font-bold text-surface-800 mb-1">Ad Spend Sync</h3>
            <p className="text-xs text-surface-400 mb-4">Pull ad spend from Meta, Google, and TikTok Ads APIs.</p>
            <div className="flex flex-wrap gap-3">
              <SyncBtn label="Meta Ads" onClick={() => doSync('meta', '/sync/ad-spend', { platform: 'meta' })} loading={syncing.meta} color="bg-blue-600 hover:bg-blue-700" />
              <SyncBtn label="Google Ads" onClick={() => doSync('google', '/sync/ad-spend', { platform: 'google' })} loading={syncing.google} color="bg-red-600 hover:bg-red-700" />
              <SyncBtn label="TikTok Ads" onClick={() => doSync('tiktok', '/sync/ad-spend', { platform: 'tiktok' })} loading={syncing.tiktok} color="bg-surface-800 hover:bg-surface-900" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-surface-100 p-6">
            <h3 className="font-display font-bold text-surface-800 mb-1">Marketplace Sales</h3>
            <p className="text-xs text-surface-400 mb-4">Import orders and fees from Amazon, TikTok Shop, and Meta/Facebook Shop.</p>
            <div className="flex flex-wrap gap-3">
              <SyncBtn label="Amazon" onClick={() => doSync('amz', '/sync/marketplaces', { platform: 'amazon' })} loading={syncing.amz} color="bg-amber-600 hover:bg-amber-700" />
              <SyncBtn label="TikTok Shop" onClick={() => doSync('tts', '/sync/marketplaces', { platform: 'tiktok_shop' })} loading={syncing.tts} color="bg-surface-800 hover:bg-surface-900" />
              <SyncBtn label="Meta Shop" onClick={() => doSync('ms', '/sync/marketplaces', { platform: 'meta_shop' })} loading={syncing.ms} color="bg-blue-600 hover:bg-blue-700" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-surface-100 p-6">
            <h3 className="font-display font-bold text-surface-800 mb-1">Elavon Payment Fees</h3>
            <p className="text-xs text-surface-400 mb-4">Import actual processing fees from Elavon Converge to replace default 2.9% estimates.</p>
            <SyncBtn label="Sync Elavon Fees" onClick={() => doSync('elavon', '/sync/elavon')} loading={syncing.elavon} color="bg-indigo-600 hover:bg-indigo-700" />
          </div>

          <div className="bg-white rounded-2xl border border-surface-100 p-6">
            <h3 className="font-display font-bold text-surface-800 mb-1">Amazon MCF Fulfillment Fees</h3>
            <p className="text-xs text-surface-400 mb-4">Import fulfillment and shipping fees from Amazon Multi-Channel Fulfillment.</p>
            <SyncBtn label="Sync Amazon MCF" onClick={() => doSync('mcf', '/sync/amazon-mcf')} loading={syncing.mcf} color="bg-amber-600 hover:bg-amber-700" />
          </div>

          <div className="bg-white rounded-2xl border border-surface-100 p-6">
            <h3 className="font-display font-bold text-surface-800 mb-1">Enginemailer Email Marketing</h3>
            <p className="text-xs text-surface-400 mb-4">Import campaign revenue and automation stats from Enginemailer.</p>
            <SyncBtn label="Sync Enginemailer" onClick={() => doSync('em', '/sync/enginemailer')} loading={syncing.em} color="bg-purple-600 hover:bg-purple-700" />
          </div>
        </div>
      )}

      {tab === 'costs' && (
        <div>
          {costsData && (
            <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-brand-800">Total Monthly Fixed Costs</span>
              <span className="font-display font-bold text-brand-900 text-lg">{fmt.currency(costsData.totalMonthly)}</span>
            </div>
          )}
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setAddingCost(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all"><Plus size={16} /> Add Cost</button>
          </div>
          {addingCost && (
            <div className="bg-white rounded-2xl border border-surface-100 p-5 mb-4 animate-scale-in">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[150px]"><label className="block text-xs font-semibold text-surface-500 mb-1">Name</label><input value={costForm.name} onChange={e=>setCostForm({...costForm,name:e.target.value})} className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30" placeholder="e.g. Shopify" /></div>
                <div className="w-32"><label className="block text-xs font-semibold text-surface-500 mb-1">Monthly $</label><input type="number" value={costForm.amount_monthly} onChange={e=>setCostForm({...costForm,amount_monthly:e.target.value})} className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30" /></div>
                <div className="w-32"><label className="block text-xs font-semibold text-surface-500 mb-1">Category</label><input value={costForm.category} onChange={e=>setCostForm({...costForm,category:e.target.value})} className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30" placeholder="SaaS" /></div>
                <button onClick={addCost} className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold">Save</button>
                <button onClick={() => setAddingCost(false)} className="px-4 py-2 bg-surface-100 text-surface-600 rounded-xl text-sm font-semibold">Cancel</button>
              </div>
            </div>
          )}
          {lc ? <SkeletonTable /> : (
            <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
              <table className="w-full">
                <thead><tr className="border-b border-surface-100">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-surface-400 uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-surface-400 uppercase tracking-wider">Category</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-surface-400 uppercase tracking-wider">Monthly</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-surface-400 uppercase tracking-wider">Daily</th>
                  <th className="w-12"></th>
                </tr></thead>
                <tbody>
                  {(costsData?.costs||[]).map(c => (
                    <tr key={c.id} className="border-b border-surface-50 hover:bg-surface-50/50">
                      <td className="px-5 py-3 text-sm font-medium">{c.name}</td>
                      <td className="px-5 py-3 text-sm text-surface-500">{c.category || '--'}</td>
                      <td className="px-5 py-3 text-sm text-right font-mono">{fmt.currency(c.amount_monthly)}</td>
                      <td className="px-5 py-3 text-sm text-right font-mono text-surface-400">{fmt.currencyExact(+(c.amount_monthly)/30)}</td>
                      <td className="px-3 py-3"><button onClick={()=>delCost(c.id)} className="p-1.5 text-surface-300 hover:text-red-500 rounded-lg hover:bg-red-50"><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                  {(!costsData?.costs?.length) && <tr><td colSpan={5} className="px-5 py-8 text-center text-surface-400 text-sm">No fixed costs added yet</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'reports' && (
        <div className="space-y-6 stagger">
          <div className="bg-white rounded-2xl border border-surface-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Mail size={20} className="text-blue-600" /></div>
              <div>
                <h3 className="font-display font-bold text-surface-800">Weekly Email Summary</h3>
                <p className="text-xs text-surface-400">Auto-sent every Monday 8 AM. Revenue, profit, orders vs last week + top products.</p>
              </div>
            </div>
            <div className="bg-surface-50 rounded-xl p-3 text-xs text-surface-500 mb-4">Requires SMTP env vars. Configure recipients in weekly_summary report config.</div>
            <SyncBtn label="Send Report Now" onClick={() => doSync('weekly', '/reports/send-weekly')} loading={syncing.weekly} color="bg-blue-600 hover:bg-blue-700" />
          </div>

          <div className="bg-white rounded-2xl border border-surface-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><FileSpreadsheet size={20} className="text-emerald-600" /></div>
              <div>
                <h3 className="font-display font-bold text-surface-800">Tax P&L CSV Export</h3>
                <p className="text-xs text-surface-400">Download P&L statement for tax filings with full cost breakdown.</p>
              </div>
            </div>
            <a href="/tax-export" className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm">
              <Download size={14} /> Go to Tax Export
            </a>
          </div>

          {reports?.length > 0 && (
            <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-surface-100">
                <h3 className="font-display font-bold text-surface-800 text-sm">Report Configurations</h3>
              </div>
              <div className="divide-y divide-surface-50">
                {reports.map(r => (
                  <div key={r.id} className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium capitalize">{r.report_type.replace(/_/g,' ')}</div>
                      <div className="text-xs text-surface-400">Frequency: {r.frequency} | Time: {r.send_time || '08:00'}</div>
                    </div>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${r.is_active?'bg-emerald-50 text-emerald-600':'bg-surface-100 text-surface-400'}`}>{r.is_active?'Active':'Paused'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'alerts' && (
        <div>
          {la ? <SkeletonTable /> : (
            <div className="space-y-3">
              {(alerts||[]).map(a => (
                <div key={a.id} className="bg-white rounded-2xl border border-surface-100 p-5 flex items-center justify-between hover:shadow-cardHover transition-shadow">
                  <div className="flex items-center gap-3">
                    <Bell size={18} className="text-amber-500" />
                    <div>
                      <span className="font-medium text-sm text-surface-800">{a.metric} {a.operator} {fmt.number(a.threshold_value)}</span>
                      {a.last_triggered_at && <div className="text-xs text-surface-400 mt-0.5">Last triggered: {new Date(a.last_triggered_at).toLocaleDateString()}</div>}
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${a.is_active?'bg-emerald-50 text-emerald-600':'bg-surface-100 text-surface-400'}`}>{a.is_active?'Active':'Paused'}</span>
                </div>
              ))}
              {(!alerts || alerts.length === 0) && <div className="text-center py-12 text-surface-400 text-sm">No alerts configured yet</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
