import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import api from '../utils/api';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import { SkeletonCards } from '../components/Skeleton';
import { PlugZap, Check, X, RefreshCw, Save, Wifi, WifiOff } from 'lucide-react';

function ConnectionCard({ c, onSaved }) {
  const toast = useToast();
  const [url, setUrl] = useState(c.url || c.defaultUrl || '');
  const [key, setKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState({ connected: c.connected, hasKey: c.hasKey, error: c.error });

  if (c.local) {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-5">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{c.icon}</div>
          <div className="flex-1"><h4 className="font-display font-bold text-surface-800 dark:text-surface-100">{c.name}</h4><div className="text-xs text-surface-400">{c.desc}</div></div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">Built-in</span>
        </div>
        <div className="text-xs text-surface-400 mt-3">Uses your store data automatically — no key needed.</div>
      </div>
    );
  }

  const save = async () => {
    setSaving(true);
    try {
      const config = { url };
      if (key && !key.includes('****')) config.api_key = key;
      await api.put('/settings/integrations/hub_' + c.id, { config });
      setStatus(s => ({ ...s, hasKey: s.hasKey || !!config.api_key }));
      toast.success(c.name + ' saved');
      setKey('');
      onSaved && onSaved();
    } catch (e) { toast.error(e.response?.data?.error || e.message); }
    finally { setSaving(false); }
  };

  const test = async () => {
    setTesting(true); setResult(null);
    try {
      const { data } = await api.post('/hub/connections/' + c.id + '/test');
      setResult(data);
      setStatus(s => ({ ...s, connected: data.connected, error: data.error }));
      if (data.connected) toast.success(c.name + ' is live'); else toast.error(c.name + ': ' + (data.error || 'not connected'));
      onSaved && onSaved();
    } catch (e) { setResult({ connected: false, error: e.response?.data?.error || e.message }); toast.error('Test failed'); }
    finally { setTesting(false); }
  };

  const badge = status.connected
    ? <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 flex items-center gap-1"><Wifi size={11} /> Live</span>
    : status.error
      ? <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 flex items-center gap-1"><WifiOff size={11} /> Down</span>
      : status.hasKey
        ? <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">Saved · untested</span>
        : <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-surface-100 dark:bg-surface-700 text-surface-400">Not connected</span>;

  return (
    <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-2xl">{c.icon}</div>
        <div className="flex-1 min-w-0"><h4 className="font-display font-bold text-surface-800 dark:text-surface-100 truncate">{c.name}</h4><div className="text-xs text-surface-400 truncate">{c.desc}</div></div>
        {badge}
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-[11px] font-semibold text-surface-500 uppercase tracking-wide">Backend URL</label>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://your-app.com" className="mt-1 w-full px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-sm dark:text-surface-100" />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-surface-500 uppercase tracking-wide">Hub API Key {status.hasKey && <span className="text-emerald-600 normal-case">· saved</span>}</label>
          <input value={key} onChange={e => setKey(e.target.value)} type="password" placeholder={status.hasKey ? '•••••••• (enter to replace)' : 'paste the Hub Key'} className="mt-1 w-full px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-sm dark:text-surface-100" />
        </div>
      </div>
      {result && (
        <div className={`mt-3 px-3 py-2 rounded-xl text-xs ${result.connected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {result.connected
            ? <span className="flex items-center gap-1"><Check size={13} /> Connected{result.sample?.length ? ' · ' + result.sample.map(s => s.key + ': ' + s.value).join(' · ') : ''}</span>
            : <span className="flex items-center gap-1"><X size={13} /> {result.error}</span>}
        </div>
      )}
      <div className="flex gap-2 mt-4">
        <button onClick={save} disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold disabled:opacity-50">{saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />} Save</button>
        <button onClick={test} disabled={testing || !url} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-surface-800 hover:bg-surface-900 dark:bg-surface-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50">{testing ? <RefreshCw size={13} className="animate-spin" /> : <PlugZap size={13} />} Test</button>
      </div>
    </div>
  );
}

export default function ConnectionsPage() {
  const { data, loading, refetch } = useApi('/hub/connections', {}, []);
  const conns = data?.connections || [];
  const apps = conns.filter(c => !c.local);
  const liveCount = apps.filter(c => c.connected).length;

  return (
    <div>
      <PageHeader title="Connections" subtitle={`Connect your apps & plugins — ${liveCount}/${apps.length} live`}>
        <button onClick={refetch} className="flex items-center gap-2 px-4 py-2 bg-surface-100 dark:bg-surface-700 rounded-xl text-xs font-semibold hover:bg-surface-200"><RefreshCw size={14} /> Refresh</button>
      </PageHeader>
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 mb-5 text-sm text-indigo-900 dark:text-indigo-200">
        Paste each app's <b>Backend URL</b> and <b>Hub API Key</b>, hit <b>Save</b>, then <b>Test</b> to confirm it's live. For your WordPress plugins (TVS Reviews, Popper) the URL is pre-filled — just paste the Hub Key from the plugin's settings page.
      </div>
      {loading ? <SkeletonCards count={6} /> : (
        <div className="grid md:grid-cols-2 gap-4">
          {conns.map(c => <ConnectionCard key={c.id} c={c} onSaved={refetch} />)}
        </div>
      )}
    </div>
  );
}
