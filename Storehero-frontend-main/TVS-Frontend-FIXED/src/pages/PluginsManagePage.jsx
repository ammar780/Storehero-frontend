import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import api from '../utils/api';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import { SkeletonCards } from '../components/Skeleton';
import { Plus, RefreshCw, Trash2, Wifi, WifiOff, PlugZap } from 'lucide-react';

const EMOJIS = ['🔌', '⭐', '🎂', '🔍', '↩️', '💸', '🧾', '🤝', '🛒', '🎁', '📣', '❓', '📧', '📊', '🏷️', '🔔'];
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

export default function PluginsManagePage() {
  const toast = useToast();
  const { data, loading, refetch } = useApi('/plugins', {}, []);
  const plugins = data?.plugins || [];
  const [form, setForm] = useState({ name: '', slug: '', url: '', api_key: '', icon: '🔌' });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState('');

  const add = async () => {
    const body = { ...form, slug: form.slug || slugify(form.name) };
    if (!body.name || !body.url) { toast.error('Name and URL are required'); return; }
    setSaving(true);
    try {
      await api.post('/plugins', body);
      toast.success(body.name + ' added');
      setForm({ name: '', slug: '', url: '', api_key: '', icon: '🔌' });
      refetch();
    } catch (e) { toast.error(e.response?.data?.error || e.message); }
    finally { setSaving(false); }
  };
  const test = async (slug) => {
    setTesting(slug);
    try {
      const { data } = await api.post(`/plugins/${slug}/test`);
      data.connected ? toast.success('Connected') : toast.error(data.error || 'Not connected');
      refetch();
    } catch (e) { toast.error('Test failed'); } finally { setTesting(''); }
  };
  const remove = async (slug, name) => {
    if (!confirm('Remove ' + name + '?')) return;
    try { await api.delete(`/plugins/${slug}`); toast.success('Removed'); refetch(); } catch (e) { toast.error(e.message); }
  };

  return (
    <div>
      <PageHeader title="Add / Manage Plugins" subtitle="Connect any WordPress plugin that has the Finance Minister connector" />
      <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5 mb-5">
        <h3 className="font-display font-bold text-sm mb-3 dark:text-surface-100 flex items-center gap-2"><Plus size={16} /> Add a plugin</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-surface-500 uppercase tracking-wide">Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })} placeholder="Quiz" className="mt-1 w-full px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-sm dark:text-surface-100" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-surface-500 uppercase tracking-wide">Backend URL</label>
            <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://thevitaminshots.com/wp-json/tvs-hub/quiz" className="mt-1 w-full px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-sm dark:text-surface-100" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-surface-500 uppercase tracking-wide">Hub API Key</label>
            <input value={form.api_key} onChange={e => setForm({ ...form, api_key: e.target.value })} type="password" placeholder="paste the Hub Key" className="mt-1 w-full px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-sm dark:text-surface-100" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-surface-500 uppercase tracking-wide">Icon</label>
            <div className="mt-1 flex flex-wrap gap-1">{EMOJIS.map(e => <button key={e} onClick={() => setForm({ ...form, icon: e })} className={`w-8 h-8 rounded-lg text-lg ${form.icon === e ? 'bg-amber-100 ring-2 ring-amber-400' : 'bg-surface-100 dark:bg-surface-700'}`}>{e}</button>)}</div>
          </div>
        </div>
        <button onClick={add} disabled={saving} className="mt-4 flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">{saving ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />} Add plugin</button>
      </div>

      {loading ? <SkeletonCards count={4} /> : plugins.length === 0 ? (
        <div className="text-center text-sm text-surface-400 py-10">No plugins connected yet — add one above.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {plugins.map(p => (
            <div key={p.slug} className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-4 flex items-center gap-3">
              <div className="text-2xl">{p.icon}</div>
              <div className="flex-1 min-w-0"><div className="font-display font-bold text-surface-800 dark:text-surface-100 truncate">{p.name}</div><div className="text-xs text-surface-400 truncate">{p.url}</div></div>
              {p.is_connected
                ? <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 flex items-center gap-1"><Wifi size={11} />Live</span>
                : <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-surface-100 dark:bg-surface-700 text-surface-400 flex items-center gap-1"><WifiOff size={11} />{p.last_error ? 'Down' : 'Untested'}</span>}
              <button onClick={() => test(p.slug)} disabled={testing === p.slug} className="p-2 rounded-lg bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300" title="Test">{testing === p.slug ? <RefreshCw size={14} className="animate-spin" /> : <PlugZap size={14} />}</button>
              <button onClick={() => remove(p.slug, p.name)} className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100" title="Remove"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
