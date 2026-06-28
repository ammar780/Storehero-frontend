import { AlertTriangle, RefreshCw } from 'lucide-react';
export default function ErrorBanner({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
        <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
      </div>
      {onRetry && <button onClick={onRetry} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-xs font-semibold"><RefreshCw size={12} /> Retry</button>}
    </div>
  );
}
