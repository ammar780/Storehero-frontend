import { useState } from 'react';
import api, { fmt } from '../utils/api';
import PageHeader from '../components/PageHeader';
import { Calculator } from 'lucide-react';

function CalcCard({ title, description, fields, endpoint, formatResult }) {
  const [form, setForm] = useState(Object.fromEntries(fields.map(f=>[f.key,f.default||''])));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const body = {};
      fields.forEach(f => { body[f.key] = +(form[f.key]) || 0; });
      const { data } = await api.post(endpoint, body);
      setResult(data);
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-surface-100 p-6 hover:shadow-cardHover transition-shadow">
      <h3 className="font-display font-bold text-surface-800 mb-1">{title}</h3>
      <p className="text-xs text-surface-400 mb-4">{description}</p>
      <div className="space-y-3">
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-xs font-semibold text-surface-500 mb-1">{f.label}</label>
            <input type="number" step={f.step||'0.01'} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})}
              className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30" placeholder={f.placeholder||''} />
          </div>
        ))}
      </div>
      <button onClick={run} disabled={loading} className="w-full mt-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all">
        {loading ? 'Calculating...' : 'Calculate'}
      </button>
      {result && (
        <div className="mt-4 p-4 bg-brand-50 rounded-xl border border-brand-100 space-y-2 animate-scale-in">
          {formatResult(result).map(([l,v,c],i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-surface-600">{l}</span>
              <span className={`font-bold ${c||'text-surface-800'}`}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CalculatorsPage() {
  return (
    <div>
      <PageHeader title="Calculators" subtitle="Quick profitability tools" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
        <CalcCard title="Breakeven ROAS" description="Find the minimum ROAS to break even" endpoint="/calc/breakeven-roas"
          fields={[{key:'price',label:'Selling Price',default:39.99},{key:'cogs',label:'COGS',default:12},{key:'shipping',label:'Shipping Cost',default:5},{key:'fee_pct',label:'Payment Fee %',default:2.9}]}
          formatResult={r=>[['Breakeven ROAS',r.breakevenRoas+'x','text-brand-700'],['Profit/Unit',fmt.currencyExact(r.profit)],['Margin',r.marginPct+'%']]} />

        <CalcCard title="Contribution Margin" description="Calculate true contribution margin" endpoint="/calc/contribution-margin"
          fields={[{key:'revenue',label:'Revenue',default:10000},{key:'cogs',label:'COGS',default:3000},{key:'shipping',label:'Shipping',default:500},{key:'payment_fees',label:'Payment Fees',default:290},{key:'ad_spend',label:'Ad Spend',default:2000}]}
          formatResult={r=>[['Gross Profit',fmt.currency(r.grossProfit)],['Contribution Margin',fmt.currency(r.contributionMargin),'text-brand-700'],['CM %',r.cmPct+'%']]} />

        <CalcCard title="MER Calculator" description="Marketing Efficiency Ratio analysis" endpoint="/calc/mer"
          fields={[{key:'revenue',label:'Total Revenue',default:50000},{key:'total_ad_spend',label:'Total Ad Spend',default:10000},{key:'cogs_pct',label:'COGS %',default:30},{key:'overhead_pct',label:'Overhead %',default:15}]}
          formatResult={r=>[['MER',r.mer+'x','text-brand-700'],['Breakeven MER',r.breakevenMer+'x'],['Profitable?',r.profitable?'Yes':'No',r.profitable?'text-emerald-600':'text-red-500']]} />

        <CalcCard title="Order Profit" description="Calculate profit on a single order" endpoint="/calc/order-profit"
          fields={[{key:'revenue',label:'Order Total',default:79.99},{key:'cogs',label:'COGS',default:24},{key:'shipping',label:'Shipping',default:5},{key:'fee_pct',label:'Fee %',default:2.9},{key:'ad_cost',label:'Ad Cost',default:15}]}
          formatResult={r=>[['Gross Profit',fmt.currencyExact(r.grossProfit)],['Net Profit',fmt.currencyExact(r.netProfit),+(r.netProfit)>=0?'text-emerald-600':'text-red-500'],['Margin',r.marginPct+'%']]} />

        <CalcCard title="pROAS" description="Profit ROAS after all costs" endpoint="/calc/proas"
          fields={[{key:'ad_spend',label:'Ad Spend',default:5000},{key:'revenue_from_ads',label:'Revenue from Ads',default:20000},{key:'cogs_pct',label:'COGS %',default:30},{key:'shipping_pct',label:'Shipping %',default:5}]}
          formatResult={r=>[['ROAS',r.roas+'x'],['pROAS',r.proas+'x','text-brand-700'],['Profit',fmt.currency(r.profit),+(r.profit)>=0?'text-emerald-600':'text-red-500']]} />
      </div>
    </div>
  );
}
