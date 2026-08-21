import { useState } from 'react';
import api from '../utils/api';
import { useToast } from './Toast';
import { Sparkles, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function AiReportPanel({ endpoint, label = 'Get AI Report' }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const run = async () => {
    setLoading(true);
    try {
      const { data } = await api.post(endpoint);
      setReport(data);
    } catch (e) {
      toast.error(e.response?.data?.error || 'AI report failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-display font-bold text-sm dark:text-surface-100 flex items-center gap-2"><Sparkles size={16} className="text-amber-500" /> AI Analysis</h3>
        <button onClick={run} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold disabled:opacity-50">
          {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />} {loading ? 'Analyzing…' : label}
        </button>
      </div>

      {report && (
        <div className="mt-4 space-y-4">
          {report.sections?.bottomLine && (
            <div>
              <div className="text-[11px] font-semibold text-surface-400 uppercase tracking-wide mb-1">Bottom Line</div>
              <p className="text-sm text-surface-700 dark:text-surface-200 leading-relaxed">{report.sections.bottomLine}</p>
            </div>
          )}
          {report.sections?.working && (
            <div>
              <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide mb-1 flex items-center gap-1"><CheckCircle2 size={12} /> What's Working</div>
              <div className="text-sm text-surface-700 dark:text-surface-200 whitespace-pre-line leading-relaxed">{report.sections.working}</div>
            </div>
          )}
          {report.sections?.attention && (
            <div>
              <div className="text-[11px] font-semibold text-amber-600 uppercase tracking-wide mb-1 flex items-center gap-1"><AlertTriangle size={12} /> Needs Attention</div>
              <div className="text-sm text-surface-700 dark:text-surface-200 whitespace-pre-line leading-relaxed">{report.sections.attention}</div>
            </div>
          )}
          {report.sections?.doNext && (
            <div>
              <div className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wide mb-1 flex items-center gap-1"><ArrowRight size={12} /> Do Next</div>
              <div className="text-sm text-surface-700 dark:text-surface-200 whitespace-pre-line leading-relaxed">{report.sections.doNext}</div>
            </div>
          )}
          {!report.sections?.bottomLine && report.report && (
            <div className="text-sm text-surface-700 dark:text-surface-200 whitespace-pre-line leading-relaxed">{report.report}</div>
          )}
          <div className="text-[11px] text-surface-400 pt-1">Generated {new Date(report.generatedAt).toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}
