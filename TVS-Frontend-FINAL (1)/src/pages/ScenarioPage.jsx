import { useState } from 'react';
import api, { fmt } from '../utils/api';
import PageHeader from '../components/PageHeader';
import { Zap, ArrowRight } from 'lucide-react';

export default function ScenarioPage() {
  const [form, setForm] = useState({ cogs_change_pct: 0, ad_spend_change_pct: 0, price_change_pct: 0, period: '30d' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try { const { data } = await api.post('/scenarios', form); setResult(data); }
    catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  const Slider = ({ label, field, min=-50, max=50 }) => (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-semibold text-surface-700">{label}</label>
        <span className={`text-sm font-bold ${form[field]>0?'text-emerald-600':form[field]<0?'text-red-500':'text-surface-500'}`}>{form[field]>0?'+':''}{form[field]}%</span>
      </div>
      <input type="range" min={min} max={max} value={form[field]} onChange={e=>setForm({...form,[field]:+e.target.value})}
        className="w-full h-2 bg-surface-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-brand-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md" />
    </div>
  );

  return (
    <div>
      <PageHeader title="What-If Scenarios" subtitle="Model changes to COGS, pricing, and ad spend" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-surface-100 p-6 space-y-6">
          <h3 className="font-display font-bold text-surface-800">Adjust Variables</h3>
          <Slider label="Price Change" field="price_change_pct" />
          <Slider label="COGS Change" field="cogs_change_pct" />
          <Slider label="Ad Spend Change" field="ad_spend_change_pct" />
          <button onClick={run} disabled={loading} className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-display font-semibold transition-all flex items-center justify-center gap-2 shadow-sm">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Zap size={16} /> Run Scenario</>}
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-2xl border border-surface-100 p-6 animate-scale-in">
            <h3 className="font-display font-bold text-surface-800 mb-4">Results</h3>
            <div className="space-y-4">
              {[['Revenue',result.base.revenue,result.scenario.revenue],['COGS',result.base.cogs,result.scenario.cogs],['Ad Spend',result.base.ad_spend,result.scenario.ad_spend],['Gross Profit',result.base.gross_profit,result.scenario.gross_profit],['Net Profit',result.base.net_profit,result.scenario.net_profit]].map(([label,base,scenario])=>{
                const diff = scenario - base;
                return (
                  <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-surface-50">
                    <span className="text-sm font-medium text-surface-700">{label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-surface-400">{fmt.currency(base)}</span>
                      <ArrowRight size={14} className="text-surface-300" />
                      <span className="text-sm font-bold text-surface-800">{fmt.currency(scenario)}</span>
                      <span className={`text-xs font-bold ${diff>=0?'text-emerald-600':'text-red-500'}`}>{diff>=0?'+':''}{fmt.currency(diff)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
