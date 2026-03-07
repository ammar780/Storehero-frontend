import { useToast } from '../components/Toast';
import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import api from '../utils/api';
import PageHeader from '../components/PageHeader';
import { SkeletonTable } from '../components/Skeleton';
import { Package, Check, X, ChevronDown, ChevronUp, Search, Upload, RefreshCw } from 'lucide-react';

function F({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-surface-500 uppercase tracking-wider mb-1 truncate" title={label}>{label}</label>
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-surface-400 text-[10px]">$</span>
        <input type="number" step="0.01" min="0" value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder || '0.00'}
          className="w-full pl-5 pr-1 py-1.5 border border-surface-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-400/30 text-right" />
      </div>
    </div>
  );
}

function Section({ title, children, color = 'brand' }) {
  const colors = { brand: 'bg-brand-50 border-brand-200 text-brand-800', blue: 'bg-blue-50 border-blue-200 text-blue-800', purple: 'bg-purple-50 border-purple-200 text-purple-800', red: 'bg-red-50 border-red-200 text-red-800', green: 'bg-emerald-50 border-emerald-200 text-emerald-800' };
  return (
    <div className="mb-4">
      <div className={`inline-flex px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border mb-2 ${colors[color]}`}>{title}</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">{children}</div>
    </div>
  );
}

function ProductRow({ product, onSaved }) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const [c, setC] = useState({
    product_cost_per_unit: product.product_cost_per_unit || product.cogs || '',
    units_per_order: product.units_per_order || 1,
    tariff_rate: product.tariff_rate || '',
    packaging: product.packaging || '',
    packaging_shipping: product.packaging_shipping || '',
    packaging_customs: product.packaging_customs || '',
    packaging_freight_forwarder: product.packaging_freight_forwarder || '',
    thank_you_card: product.thank_you_card || '',
    free_gift_cogs: product.free_gift_cogs || '',
    affiliate_samples_cogs: product.affiliate_samples_cogs || '',
    shipping_subscription: product.shipping_subscription || '',
    shipping_onetime: product.shipping_onetime || '',
    affiliate_samples_shipping: product.affiliate_samples_shipping || '',
    subscription_sales_price: product.subscription_sales_price || '',
    onetime_sales_price: product.onetime_sales_price || product.price || '',
    bulk_shipping_cost: product.bulk_shipping_cost || '',
    ground_transport: product.ground_transport || '',
    insurance_cost: product.insurance_cost || '',
    tariffs: product.tariffs || '',
    other_costs: product.other_costs || '',
  });
  const set = (k, v) => setC({ ...c, [k]: v });

  const landed = Object.entries(c).reduce((s, [k, v]) => {
    if (['units_per_order', 'tariff_rate', 'subscription_sales_price', 'onetime_sales_price'].includes(k)) return s;
    return s + (+(v) || 0);
  }, 0);
  const price = +(product.price) || 0;
  const margin = price > 0 && landed > 0 ? ((price - landed) / price * 100).toFixed(1) : null;
  const mc = margin > 60 ? 'text-emerald-600' : margin > 30 ? 'text-amber-600' : margin > 0 ? 'text-red-600' : 'text-surface-400';

  const save = async () => {
    setSaving(true);
    try { await api.put('/products/' + product.id + '/cogs', c); toast.success(`${product.name} costs saved`); onSaved(); setExpanded(false); }
    catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className={`bg-white dark:bg-surface-800 rounded-2xl border transition-all ${expanded ? 'border-brand-300 shadow-card' : 'border-surface-100 hover:shadow-card'}`}>
      <button onClick={() => setExpanded(!expanded)} className="w-full px-4 py-3 flex items-center gap-3 text-left">
        <div className="flex-shrink-0">{product.image_url ? <img src={product.image_url} className="w-10 h-10 rounded-xl object-cover border" alt="" /> : <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center"><Package size={16} className="text-surface-400" /></div>}</div>
        <div className="flex-1 min-w-0"><div className="font-semibold text-surface-800 dark:text-surface-200 text-sm truncate">{product.name}</div>{product.sku && <div className="text-xs text-surface-400">{product.sku}</div>}</div>
        <div className="hidden sm:flex items-center gap-5 flex-shrink-0 text-right">
          <div><div className="text-[9px] text-surface-400 uppercase">Price</div><div className="font-mono text-sm font-semibold">{fmt.currencyExact(price)}</div></div>
          <div><div className="text-[9px] text-surface-400 uppercase">Landed</div><div className="font-mono text-sm">{landed > 0 ? fmt.currencyExact(landed) : <span className="text-surface-300 text-xs">Set costs</span>}</div></div>
          <div><div className="text-[9px] text-surface-400 uppercase">Margin</div><span className={`font-bold text-sm ${mc}`}>{margin ? margin + '%' : '--'}</span></div>
          <div><div className="text-[9px] text-surface-400 uppercase">Sold</div><div className="font-mono text-sm">{fmt.number(product.total_sold)}</div></div>
        </div>
        {expanded ? <ChevronUp size={14} className="text-surface-400" /> : <ChevronDown size={14} className="text-surface-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-surface-100 pt-3 animate-scale-in">
          <Section title="Product COGS" color="brand">
            <F label="Product Cost/Unit" value={c.product_cost_per_unit} onChange={v => set('product_cost_per_unit', v)} />
            <F label="Units Per Order" value={c.units_per_order} onChange={v => set('units_per_order', v)} />
            <F label="Tariff Rate %" value={c.tariff_rate} onChange={v => set('tariff_rate', v)} />
            <F label="Free Gift COGS" value={c.free_gift_cogs} onChange={v => set('free_gift_cogs', v)} />
            <F label="Affiliate Samples COGS" value={c.affiliate_samples_cogs} onChange={v => set('affiliate_samples_cogs', v)} />
          </Section>
          <Section title="Packaging & Import" color="blue">
            <F label="Packaging" value={c.packaging} onChange={v => set('packaging', v)} />
            <F label="Packaging Shipping" value={c.packaging_shipping} onChange={v => set('packaging_shipping', v)} />
            <F label="Packaging Customs" value={c.packaging_customs} onChange={v => set('packaging_customs', v)} />
            <F label="Freight Forwarder" value={c.packaging_freight_forwarder} onChange={v => set('packaging_freight_forwarder', v)} />
            <F label="Thank You Card" value={c.thank_you_card} onChange={v => set('thank_you_card', v)} />
          </Section>
          <Section title="Shipping" color="purple">
            <F label="Shipping (Subscription)" value={c.shipping_subscription} onChange={v => set('shipping_subscription', v)} />
            <F label="Shipping (One-Time)" value={c.shipping_onetime} onChange={v => set('shipping_onetime', v)} />
            <F label="Affiliate Samples Shipping" value={c.affiliate_samples_shipping} onChange={v => set('affiliate_samples_shipping', v)} />
            <F label="Bulk Shipping" value={c.bulk_shipping_cost} onChange={v => set('bulk_shipping_cost', v)} />
            <F label="Ground Transport" value={c.ground_transport} onChange={v => set('ground_transport', v)} />
          </Section>
          <Section title="Insurance & Tariffs" color="red">
            <F label="Insurance" value={c.insurance_cost} onChange={v => set('insurance_cost', v)} />
            <F label="Tariffs / Duties" value={c.tariffs} onChange={v => set('tariffs', v)} />
            <F label="Other Costs" value={c.other_costs} onChange={v => set('other_costs', v)} />
          </Section>
          <Section title="Pricing" color="green">
            <F label="Subscription Price" value={c.subscription_sales_price} onChange={v => set('subscription_sales_price', v)} />
            <F label="One-Time Price" value={c.onetime_sales_price} onChange={v => set('onetime_sales_price', v)} />
          </Section>

          <div className="flex items-center justify-between bg-surface-50 dark:bg-surface-900 rounded-xl p-3 mt-3 mb-3">
            <div className="flex items-center gap-6 flex-wrap">
              <div><span className="text-[10px] text-surface-400 uppercase">Total Landed Cost</span><div className="font-display font-bold text-lg">{fmt.currencyExact(landed)}</div></div>
              <div><span className="text-[10px] text-surface-400 uppercase">Margin</span><div className={`font-display font-bold text-lg ${mc}`}>{margin ? margin+'%' : '--'}</div></div>
              <div><span className="text-[10px] text-surface-400 uppercase">Profit/Unit</span><div className={`font-display font-bold text-lg ${price-landed>0?'text-emerald-600':'text-red-500'}`}>{landed>0?fmt.currencyExact(price-landed):'--'}</div></div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"><Check size={14} /> {saving?'Saving...':'Save All Costs'}</button>
            <button onClick={() => setExpanded(false)} className="px-4 py-2 bg-surface-100 text-surface-600 rounded-xl text-sm font-semibold">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  const { data, loading, refetch } = useApi('/products', { limit: 500 });
  const { data: missingData } = useApi('/products/missing-cogs');
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [importing, setImporting] = useState(false);

  const handleCsvImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { toast.error('CSV needs header + data rows'); return; }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z_]/g, ''));
      const rows = lines.slice(1).map(line => { const vals = line.split(','); const row = {}; headers.forEach((h, i) => { row[h] = vals[i]?.trim() || ''; }); return row; });
      const { data: result } = await api.post('/products/bulk-cogs-csv', { rows });
      toast.success(`Updated ${result.updated} products. ${result.notFound} not found.`);
      refetch();
    } catch (err) { toast.error(err.response?.data?.error || err.message); }
    finally { setImporting(false); e.target.value = ''; }
  };

  const allProducts = data?.products || [];
  const products = allProducts.filter(p => {
    if (filter === 'missing' && (+(p.cogs) > 0 || +(p.landed_cost) > 0)) return false;
    if (filter === 'has_cogs' && +(p.cogs) <= 0 && +(p.landed_cost) <= 0) return false;
    if (search && !p.name?.toLowerCase().includes(search.toLowerCase()) && !p.sku?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <PageHeader title="Products" subtitle={data ? `${data.total} products — click any to edit all cost fields` : 'Loading...'} />
      {missingData?.count > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4 flex items-center justify-between">
          <span className="text-sm text-amber-800"><span className="font-bold">{missingData.count} products</span> have no costs — profit calculations will be inaccurate</span>
          <button onClick={() => setFilter('missing')} className="text-xs font-semibold text-amber-700 underline">Show them</button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="w-full pl-9 pr-4 py-2.5 border border-surface-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
        </div>
        <div className="inline-flex bg-white rounded-xl border border-surface-200 p-0.5">
          {[['all','All'],['missing','No COGS'],['has_cogs','Has COGS']].map(([k,l]) => (
            <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter===k?'bg-brand-500 text-white':'text-surface-500'}`}>{l}</button>
          ))}
        </div>
        <label className={`flex items-center gap-2 px-4 py-2.5 bg-surface-800 text-white rounded-xl text-xs font-semibold cursor-pointer ${importing?'opacity-50':''}`}>
          {importing ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />} {importing ? 'Importing...' : 'Import CSV'}
          <input type="file" accept=".csv" onChange={handleCsvImport} className="hidden" disabled={importing} />
        </label>
      </div>
      {loading ? <SkeletonTable /> : (
        <div className="space-y-2 stagger">
          {products.map(p => <ProductRow key={p.id} product={p} onSaved={refetch} />)}
          {products.length === 0 && <div className="text-center py-12 text-surface-400">No products found</div>}
        </div>
      )}
    </div>
  );
}
