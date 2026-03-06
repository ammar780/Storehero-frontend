import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import api from '../utils/api';
import PageHeader from '../components/PageHeader';
import { SkeletonCards } from '../components/Skeleton';
import { Target, Plus, Trash2, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

function TrafficLight({ actual, target }) {
  const pct = target > 0 ? (actual / target) * 100 : 0;
  if (pct >= 90) return <CheckCircle size={18} className="text-emerald-500" />;
  if (pct >= 70) return <AlertCircle size={18} className="text-amber-500" />;
  return <XCircle size={18} className="text-red-500" />;
}

export default function GoalsPage() {
  const year = new Date().getFullYear();
  const { data, loading, refetch } = useApi('/dashboard/goals-pacing', { year });
  const { data: goals, refetch: refetchGoals } = useApi('/settings/goals', { year });
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ metric_type: 'revenue', annual_target: '' });

  const addGoal = async () => {
    if (!form.annual_target) return;
    await api.post('/settings/goals', { year, ...form, annual_target: +form.annual_target });
    setAdding(false); setForm({ metric_type: 'revenue', annual_target: '' });
    refetchGoals(); refetch();
  };

  const delGoal = async (id) => { await api.delete('/settings/goals/' + id); refetchGoals(); refetch(); };

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div>
      <PageHeader title="Goals & Pacing" subtitle={`${year} goal tracking with traffic lights`}>
        <button onClick={() => setAdding(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"><Plus size={16} /> Add Goal</button>
      </PageHeader>

      {adding && (
        <div className="bg-white rounded-2xl border border-surface-100 p-6 mb-6 animate-scale-in">
          <h3 className="font-display font-bold text-surface-800 mb-4">New Goal</h3>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-surface-500 mb-1.5 uppercase">Metric</label>
              <select value={form.metric_type} onChange={e => setForm({...form, metric_type: e.target.value})} className="px-3 py-2.5 border border-surface-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400/30">
                {['revenue','gross_profit','net_profit','orders','new_customers'].map(m => <option key={m} value={m}>{m.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 mb-1.5 uppercase">Annual Target</label>
              <input type="number" value={form.annual_target} onChange={e=>setForm({...form,annual_target:e.target.value})} className="px-3 py-2.5 border border-surface-200 rounded-xl text-sm w-40 focus:outline-none focus:ring-2 focus:ring-brand-400/30" placeholder="e.g. 500000" />
            </div>
            <button onClick={addGoal} className="px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-all">Save</button>
            <button onClick={() => setAdding(false)} className="px-4 py-2.5 bg-surface-100 text-surface-600 rounded-xl text-sm font-semibold hover:bg-surface-200 transition-all">Cancel</button>
          </div>
        </div>
      )}

      {loading ? <SkeletonCards count={3} /> : (
        <div className="space-y-6">
          {(goals||[]).map(g => {
            const actuals = data?.actuals || [];
            const monthlyTarget = +(g.annual_target) / 12;
            return (
              <div key={g.id} className="bg-white rounded-2xl border border-surface-100 p-6 hover:shadow-cardHover transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Target size={20} className="text-brand-600" />
                    <div>
                      <h3 className="font-display font-bold text-surface-800 capitalize">{g.metric_type.replace(/_/g,' ')}</h3>
                      <span className="text-sm text-surface-500">Annual target: {fmt.currency(g.annual_target)}</span>
                    </div>
                  </div>
                  <button onClick={() => delGoal(g.id)} className="p-2 text-surface-300 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all"><Trash2 size={16} /></button>
                </div>
                <div className="grid grid-cols-6 lg:grid-cols-12 gap-2">
                  {months.map((m, i) => {
                    const actual = actuals.find(a => +a.month === i + 1);
                    const val = actual ? +(actual[g.metric_type] || actual.revenue || 0) : 0;
                    const pct = monthlyTarget > 0 ? Math.min((val / monthlyTarget) * 100, 100) : 0;
                    const isCurrent = i + 1 === data?.currentMonth;
                    return (
                      <div key={m} className={`text-center p-2 rounded-xl ${isCurrent ? 'bg-brand-50 ring-2 ring-brand-400/30' : 'bg-surface-50'}`}>
                        <div className="text-[10px] text-surface-400 font-semibold uppercase">{m}</div>
                        <div className="w-full h-1.5 bg-surface-200 rounded-full mt-1 overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-400' : pct > 0 ? 'bg-red-400' : 'bg-surface-200'}`} style={{width: pct + '%'}} />
                        </div>
                        <div className="text-[10px] font-semibold text-surface-600 mt-1">{fmt.compact(val)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {(!goals || goals.length === 0) && !adding && (
            <div className="text-center py-16"><Target size={48} className="text-surface-200 mx-auto mb-4" /><h3 className="font-display font-bold text-surface-500">No goals set</h3><p className="text-surface-400 text-sm mt-1">Click "Add Goal" to set revenue, profit, or order targets</p></div>
          )}
        </div>
      )}
    </div>
  );
}
