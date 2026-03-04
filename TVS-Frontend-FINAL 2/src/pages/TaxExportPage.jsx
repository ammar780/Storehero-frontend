import { useState } from 'react';
import api from '../utils/api';
import PageHeader from '../components/PageHeader';
import { FileSpreadsheet, Download, Calendar } from 'lucide-react';

export default function TaxExportPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState('');
  const [loading, setLoading] = useState(false);

  const download = async () => {
    setLoading(true);
    try {
      const params = { year };
      if (month) params.month = month;
      const response = await api.get('/export/tax-pnl', { params, responseType: 'blob' });
      const data = response.data;
      const url = window.URL.createObjectURL(new Blob([data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `TVS_PnL_Tax_${year}${month ? '-' + String(month).padStart(2, '0') : ''}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) { alert('Export failed: ' + (e.response?.data?.error || e.message)); }
    finally { setLoading(false); }
  };

  const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div>
      <PageHeader title="Tax Filing Export" subtitle="Download P&L reports for tax preparation" />

      <div className="max-w-xl">
        <div className="bg-white rounded-2xl border border-surface-100 p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-surface-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <FileSpreadsheet size={20} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-display font-bold text-surface-800">Profit & Loss CSV</h3>
              <p className="text-xs text-surface-400">Tax-ready P&L breakdown with all revenue, costs, and expenses</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-500 mb-1.5 uppercase tracking-wider">Year</label>
              <select value={year} onChange={e => setYear(+e.target.value)} className="w-full px-3 py-2.5 border border-surface-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400/30">
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 mb-1.5 uppercase tracking-wider">Month (optional)</label>
              <select value={month} onChange={e => setMonth(e.target.value)} className="w-full px-3 py-2.5 border border-surface-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400/30">
                <option value="">Full Year</option>
                {months.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-surface-50 rounded-xl p-4 text-sm text-surface-600 space-y-1.5">
            <div className="font-semibold text-surface-700 mb-2">CSV includes:</div>
            <div>• Gross revenue, discounts, refunds, net revenue</div>
            <div>• COGS breakdown (product, shipping, payment fees)</div>
            <div>• Ad spend by platform (Meta, Google, TikTok)</div>
            <div>• Fixed & operating expenses itemized</div>
            <div>• Monthly P&L summary with net margins</div>
            <div>• Sales tax collected</div>
          </div>

          <button onClick={download} disabled={loading} className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-display font-semibold transition-all flex items-center justify-center gap-2 text-sm shadow-sm disabled:opacity-50">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Download size={16} /> Download Tax P&L CSV</>}
          </button>
        </div>
      </div>
    </div>
  );
}
