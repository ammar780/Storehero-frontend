import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import api from '../utils/api';
import PageHeader from '../components/PageHeader';
import { SkeletonTable } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { RefreshCw, Plus, Trash2, Wifi, WifiOff, Bell, Mail, FileSpreadsheet, Download, Save, Eye, EyeOff, ChevronDown, ChevronUp, ExternalLink, Key, CheckCircle, XCircle } from 'lucide-react';

function Tab({ tabs, active, onChange }) {
  return (
    <div className="inline-flex bg-white rounded-xl border border-surface-200 p-1 shadow-sm mb-6 flex-wrap gap-0.5">
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${active===t.key?'bg-brand-900 text-white':'text-surface-500 hover:text-surface-700'}`}>{t.label}</button>
      ))}
    </div>
  );
}

function SyncBtn({ label, onClick, loading, color = 'bg-brand-600 hover:bg-brand-700', small }) {
  return (
    <button onClick={onClick} disabled={loading} className={`flex items-center gap-2 ${small?'px-3 py-1.5 text-xs':'px-4 py-2.5 text-sm'} ${color} text-white rounded-xl font-semibold transition-all shadow-sm disabled:opacity-50`}>
      <RefreshCw size={small?12:14} className={loading ? 'animate-spin' : ''} /> {loading ? 'Syncing...' : label}
    </button>
  );
}

// Integration config definitions - what fields each platform needs
const INTEGRATION_FIELDS = {
  woocommerce: {
    label: 'WooCommerce', color: 'bg-purple-600',
    fields: [
      { key: 'store_url', label: 'Store URL', placeholder: 'https://thevitaminshots.com', type: 'url' },
      { key: 'consumer_key', label: 'Consumer Key', placeholder: 'ck_...', type: 'password' },
      { key: 'consumer_secret', label: 'Consumer Secret', placeholder: 'cs_...', type: 'password' },
    ],
    syncEndpoint: '/sync/woocommerce',
  },
  meta_ads: {
    label: 'Meta Ads', color: 'bg-blue-600',
    fields: [
      { key: 'access_token', label: 'Access Token', placeholder: 'EAABs...', type: 'password' },
      { key: 'ad_account_id', label: 'Ad Account ID', placeholder: 'act_123456789', type: 'text' },
    ],
    syncEndpoint: '/sync/ad-spend', syncBody: { platform: 'meta' },
  },
  google_ads: {
    label: 'Google Ads', color: 'bg-red-600',
    fields: [
      { key: 'developer_token', label: 'Developer Token', type: 'password' },
      { key: 'client_id', label: 'OAuth Client ID', type: 'text' },
      { key: 'client_secret', label: 'OAuth Client Secret', type: 'password' },
      { key: 'refresh_token', label: 'Refresh Token', type: 'password' },
      { key: 'customer_id', label: 'Customer ID', placeholder: '123-456-7890', type: 'text' },
    ],
    syncEndpoint: '/sync/ad-spend', syncBody: { platform: 'google' },
  },
  tiktok_ads: {
    label: 'TikTok Ads', color: 'bg-gray-800',
    fields: [
      { key: 'access_token', label: 'Access Token', type: 'password' },
      { key: 'advertiser_id', label: 'Advertiser ID', type: 'text' },
    ],
    syncEndpoint: '/sync/ad-spend', syncBody: { platform: 'tiktok' },
  },
  elavon: {
    label: 'Elavon', color: 'bg-indigo-600',
    fields: [
      { key: 'merchant_id', label: 'Merchant ID', type: 'text' },
      { key: 'user_id', label: 'User ID', type: 'text' },
      { key: 'pin', label: 'PIN', type: 'password' },
    ],
    syncEndpoint: '/sync/elavon',
  },
  amazon_marketplace: {
    label: 'Amazon Seller', color: 'bg-amber-600',
    fields: [
      { key: 'client_id', label: 'SP-API Client ID', placeholder: 'amzn1.application-oa2-client.xxx', type: 'text' },
      { key: 'client_secret', label: 'SP-API Client Secret', type: 'password' },
      { key: 'refresh_token', label: 'Refresh Token', type: 'password' },
      { key: 'marketplace_id', label: 'Marketplace ID', placeholder: 'ATVPDKIKX0DER', type: 'text' },
    ],
    syncEndpoint: '/sync/marketplaces', syncBody: { platform: 'amazon' },
  },
  amazon_mcf: {
    label: 'Amazon MCF', color: 'bg-amber-700',
    fields: [
      { key: 'uses_amazon_creds', label: 'Uses same Amazon SP-API credentials above', type: 'info' },
    ],
    syncEndpoint: '/sync/amazon-mcf',
  },
  tiktok_shop: {
    label: 'TikTok Shop', color: 'bg-gray-900',
    fields: [
      { key: 'access_token', label: 'Access Token', type: 'password' },
      { key: 'app_key', label: 'App Key', type: 'text' },
      { key: 'shop_id', label: 'Shop ID', type: 'text' },
    ],
    syncEndpoint: '/sync/marketplaces', syncBody: { platform: 'tiktok_shop' },
  },
  meta_shop: {
    label: 'Meta Shop', color: 'bg-blue-700',
    fields: [
      { key: 'access_token', label: 'Commerce Access Token', type: 'password' },
      { key: 'page_id', label: 'Page ID', type: 'text' },
    ],
    syncEndpoint: '/sync/marketplaces', syncBody: { platform: 'meta_shop' },
  },
  enginemailer: {
    label: 'Enginemailer / EmailIt', color: 'bg-purple-700',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password' },
      { key: 'api_base_url', label: 'API Base URL', placeholder: 'https://api.emailit.com/v2', type: 'url' },
    ],
    syncEndpoint: '/sync/enginemailer',
  },
  microsoft_ads: {
    label: 'Microsoft Ads (Bing)', color: 'bg-cyan-700',
    fields: [
      { key: 'client_id', label: 'App Client ID', type: 'text' },
      { key: 'refresh_token', label: 'OAuth Refresh Token', type: 'password' },
      { key: 'developer_token', label: 'Developer Token', type: 'password' },
      { key: 'account_id', label: 'Account ID', type: 'text' },
    ],
    syncEndpoint: '/sync/microsoft-ads',
  },
  google_analytics: {
    label: 'Google Analytics 4', color: 'bg-orange-600',
    fields: [
      { key: 'property_id', label: 'GA4 Property ID', placeholder: '123456789', type: 'text' },
      { key: 'service_account_json', label: 'Service Account JSON Key', placeholder: 'Paste full JSON key', type: 'password' },
    ],
  },
  search_console: {
    label: 'Google Search Console', color: 'bg-green-700',
    fields: [
      { key: 'site_url', label: 'Site URL', placeholder: 'https://thevitaminshots.com', type: 'url' },
      { key: 'service_account_json', label: 'Service Account JSON Key', placeholder: 'Paste full JSON key (same as GA4)', type: 'password' },
    ],
  },
};

function IntegrationCard({ integration, onSave, onSync, syncing }) {
  const def = INTEGRATION_FIELDS[integration.platform];
  const [expanded, setExpanded] = useState(false);
  const [config, setConfig] = useState({});
  const [showSecrets, setShowSecrets] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const c = typeof integration.config === 'string' ? JSON.parse(integration.config) : (integration.config || {});
      setConfig(c);
    } catch { setConfig({}); }
  }, [integration]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/settings/integrations/' + integration.platform, { config, is_connected: Object.values(config).some(v => v && v.length > 3) });
      onSave();
      toast.success('Credentials saved');
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  if (!def) {
    // Generic card for integrations without field definitions
    return (
      <div className={`bg-white rounded-2xl border p-5 transition-all hover:shadow-cardHover ${integration.is_connected ? 'border-emerald-200' : 'border-surface-100'}`}>
        <div className="flex items-center justify-between">
          <h4 className="font-display font-bold text-surface-800 capitalize">{integration.platform.replace(/_/g, ' ')}</h4>
          {integration.is_connected ? <Wifi size={16} className="text-emerald-500" /> : <WifiOff size={16} className="text-surface-300" />}
        </div>
        <div className="text-xs text-surface-400 mt-2">Status: {integration.is_connected ? 'Connected' : 'Not connected'}</div>
        {integration.last_sync_at && <div className="text-xs text-surface-400">Last sync: {new Date(integration.last_sync_at).toLocaleString()}</div>}
      </div>
    );
  }

  const hasCredentials = def.fields.filter(f => f.type !== 'info').some(f => config[f.key] && String(config[f.key]).length > 3);

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-cardHover ${integration.is_connected ? 'border-emerald-200' : 'border-surface-100'}`}>
      {/* Header */}
      <button onClick={() => setExpanded(!expanded)} className="w-full px-5 py-4 flex items-center justify-between hover:bg-surface-50/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${def.color} flex items-center justify-center text-white`}>
            <Key size={14} />
          </div>
          <div className="text-left">
            <h4 className="font-display font-bold text-surface-800 text-sm">{def.label}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              {integration.is_connected ? (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600"><CheckCircle size={10} /> Connected</span>
              ) : hasCredentials ? (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600"><Key size={10} /> Keys saved</span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-surface-400"><XCircle size={10} /> Not configured</span>
              )}
              {integration.last_sync_at && <span className="text-[10px] text-surface-400">Synced {new Date(integration.last_sync_at).toLocaleDateString()}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {def.syncEndpoint && hasCredentials && (
            <SyncBtn label="Sync" onClick={(e) => { e.stopPropagation(); onSync(def.syncEndpoint, def.syncBody); }} loading={syncing} color={def.color} small />
          )}
          {expanded ? <ChevronUp size={16} className="text-surface-400" /> : <ChevronDown size={16} className="text-surface-400" />}
        </div>
      </button>

      {/* Expanded config */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-surface-100 pt-4 space-y-3 animate-scale-in">
          {integration.error_message && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl">{integration.error_message}</div>
          )}
          {def.fields.map(f => {
            if (f.type === 'info') return <div key={f.key} className="text-xs text-surface-500 italic px-1">{f.label}</div>;
            const isSecret = f.type === 'password';
            const shown = showSecrets[f.key];
            return (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-surface-500 mb-1">{f.label}</label>
                <div className="relative">
                  <input
                    type={isSecret && !shown ? 'password' : 'text'}
                    value={config[f.key] || ''}
                    onChange={e => setConfig({ ...config, [f.key]: e.target.value })}
                    placeholder={f.placeholder || ''}
                    className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30 pr-10 font-mono text-xs"
                  />
                  {isSecret && (
                    <button onClick={() => setShowSecrets({ ...showSecrets, [f.key]: !shown })} className="absolute right-2 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 p-1">
                      {shown ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-2 pt-2">
            <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50">
              <Save size={12} /> {saving ? 'Saving...' : 'Save Credentials'}
            </button>
            {def.syncEndpoint && (
              <SyncBtn label="Save & Sync" onClick={async () => { await save(); onSync(def.syncEndpoint, def.syncBody); }} loading={syncing} color={def.color} small />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState('integrations');
  const { data: integrations, loading: li, refetch: ri } = useApi('/settings/integrations');
  const { data: costsData, loading: lc, refetch: rc } = useApi('/settings/fixed-costs');
  const { data: alerts, loading: la } = useApi('/settings/alerts');
  const { data: reports } = useApi('/settings/reports');
  const toast = useToast();
  const [syncing, setSyncing] = useState({});
  const [addingCost, setAddingCost] = useState(false);
  const [costForm, setCostForm] = useState({ name: '', amount_monthly: '', category: '' });

  const doSync = async (endpoint, body = {}) => {
    const key = endpoint;
    setSyncing(s => ({ ...s, [key]: true }));
    try {
      const { data } = await api.post(endpoint, body);
      toast.success(data.message || data.status || 'Sync complete!');
      ri();
    } catch (e) { toast.error(e.response?.data?.error || e.message); }
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
    { key: 'costs', label: 'Fixed Costs' },
    { key: 'reports', label: 'Reports & Tax' },
    { key: 'alerts', label: 'Alerts' },
  ];

  // Group integrations: configured ones first
  const sortedIntegrations = [...(integrations || [])].sort((a, b) => {
    const aDef = INTEGRATION_FIELDS[a.platform];
    const bDef = INTEGRATION_FIELDS[b.platform];
    if (a.is_connected && !b.is_connected) return -1;
    if (!a.is_connected && b.is_connected) return 1;
    if (aDef && !bDef) return -1;
    if (!aDef && bDef) return 1;
    return a.platform.localeCompare(b.platform);
  });

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage integrations, costs, reports, and alerts" />
      <Tab tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'integrations' && (
        <div>
          <p className="text-sm text-surface-500 mb-4">Click any integration to expand and enter your API credentials. Keys are stored securely in your database.</p>
          {li ? <SkeletonTable /> : (
            <div className="space-y-3 stagger">
              {sortedIntegrations.map(int => (
                <IntegrationCard
                  key={int.id}
                  integration={int}
                  onSave={() => ri()}
                  onSync={(ep, body) => doSync(ep, body)}
                  syncing={syncing[INTEGRATION_FIELDS[int.platform]?.syncEndpoint]}
                />
              ))}
            </div>
          )}
          {/* Utility: Rebuild daily metrics */}
          <div className="mt-6 bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
            <h3 className="font-display font-bold text-surface-800 dark:text-surface-200 text-sm mb-2">Rebuild Dashboard Metrics</h3>
            <p className="text-xs text-surface-400 mb-3">If your dashboard shows $0 but you have orders, click this to recalculate all daily metrics from order data.</p>
            <SyncBtn label="Rebuild Metrics Now" onClick={() => doSync('/sync/rebuild-metrics')} loading={syncing['/sync/rebuild-metrics']} color="bg-red-600 hover:bg-red-700" />
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
                <div className="flex-1 min-w-[150px]"><label className="block text-xs font-semibold text-surface-500 mb-1">Name</label><input value={costForm.name} onChange={e => setCostForm({...costForm,name:e.target.value})} className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30" placeholder="e.g. Shopify, Hosting" /></div>
                <div className="w-32"><label className="block text-xs font-semibold text-surface-500 mb-1">Monthly $</label><input type="number" value={costForm.amount_monthly} onChange={e => setCostForm({...costForm,amount_monthly:e.target.value})} className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30" /></div>
                <div className="w-32"><label className="block text-xs font-semibold text-surface-500 mb-1">Category</label><input value={costForm.category} onChange={e => setCostForm({...costForm,category:e.target.value})} className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30" placeholder="SaaS" /></div>
                <button onClick={addCost} className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold">Save</button>
                <button onClick={() => setAddingCost(false)} className="px-4 py-2 bg-surface-100 text-surface-600 rounded-xl text-sm font-semibold">Cancel</button>
              </div>
            </div>
          )}
          {lc ? <SkeletonTable /> : (
            <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
              <table className="w-full">
                <thead><tr className="border-b border-surface-100">
                  {['Name','Category','Monthly','Daily',''].map(h => <th key={h} className={`px-5 py-3 ${h?'text-left':'w-12'} text-[11px] font-semibold text-surface-400 uppercase tracking-wider`}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {(costsData?.costs||[]).map(c => (
                    <tr key={c.id} className="border-b border-surface-50 hover:bg-surface-50/50">
                      <td className="px-5 py-3 text-sm font-medium">{c.name}</td>
                      <td className="px-5 py-3 text-sm text-surface-500">{c.category || '--'}</td>
                      <td className="px-5 py-3 text-sm font-mono">{fmt.currency(c.amount_monthly)}</td>
                      <td className="px-5 py-3 text-sm font-mono text-surface-400">{fmt.currencyExact(+(c.amount_monthly)/30)}</td>
                      <td className="px-3 py-3"><button onClick={() => delCost(c.id)} className="p-1.5 text-surface-300 hover:text-red-500 rounded-lg hover:bg-red-50"><Trash2 size={14} /></button></td>
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
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Mail size={20} className="text-blue-600" /></div>
              <div>
                <h3 className="font-display font-bold text-surface-800">Weekly Email Summary</h3>
                <p className="text-xs text-surface-400">Auto-sent every Monday 8 AM with revenue, profit, orders vs last week.</p>
              </div>
            </div>
            <div className="bg-surface-50 rounded-xl p-3 text-xs text-surface-500 mb-4">Configure SMTP settings as env vars on Railway: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM</div>
            <SyncBtn label="Send Report Now" onClick={() => doSync('/reports/send-weekly')} loading={syncing['/reports/send-weekly']} color="bg-blue-600 hover:bg-blue-700" />
          </div>

          <div className="bg-white rounded-2xl border border-surface-100 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><FileSpreadsheet size={20} className="text-emerald-600" /></div>
              <div>
                <h3 className="font-display font-bold text-surface-800">Tax P&L CSV Export</h3>
                <p className="text-xs text-surface-400">Download comprehensive P&L for tax filings — revenue, COGS, ad spend, fixed costs.</p>
              </div>
            </div>
            <a href="/tax-export" className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm">
              <Download size={14} /> Go to Tax Export
            </a>
          </div>

          {reports?.length > 0 && (
            <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-surface-100"><h3 className="font-display font-bold text-surface-800 text-sm">Report Schedules</h3></div>
              <div className="divide-y divide-surface-50">
                {reports.map(r => (
                  <div key={r.id} className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium capitalize">{r.report_type.replace(/_/g,' ')}</div>
                      <div className="text-xs text-surface-400">{r.frequency} at {r.send_time || '08:00'}</div>
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
