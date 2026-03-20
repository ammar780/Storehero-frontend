import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext();
export const useToast = () => useContext(ToastContext);

const ICONS = { success: CheckCircle, error: XCircle, warning: AlertTriangle, info: Info };
const COLORS = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};
const ICON_COLORS = { success: 'text-emerald-500', error: 'text-red-500', warning: 'text-amber-500', info: 'text-blue-500' };

function ToastItem({ toast, onDismiss }) {
  const [exiting, setExiting] = useState(false);
  const Icon = ICONS[toast.type] || Info;

  useEffect(() => {
    const t = setTimeout(() => { setExiting(true); setTimeout(() => onDismiss(toast.id), 300); }, toast.duration || 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm max-w-md transition-all duration-300 ${COLORS[toast.type]} ${exiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0 animate-slide-right'}`}>
      <Icon size={18} className={`flex-shrink-0 mt-0.5 ${ICON_COLORS[toast.type]}`} />
      <div className="flex-1 min-w-0">
        {toast.title && <div className="font-semibold text-sm">{toast.title}</div>}
        <div className="text-sm opacity-90">{toast.message}</div>
      </div>
      <button onClick={() => { setExiting(true); setTimeout(() => onDismiss(toast.id), 300); }} className="flex-shrink-0 p-0.5 rounded-lg opacity-50 hover:opacity-100"><X size={14} /></button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  let counter = 0;

  const toast = useCallback((type, message, title, duration) => {
    const id = Date.now() + (counter++);
    setToasts(t => [...t, { id, type, message, title, duration }]);
  }, []);

  const dismiss = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);

  const api = {
    success: (msg, title) => toast('success', msg, title, 3000),
    error: (msg, title) => toast('error', msg, title || 'Error', 6000),
    warning: (msg, title) => toast('warning', msg, title, 5000),
    info: (msg, title) => toast('info', msg, title, 4000),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map(t => <ToastItem key={t.id} toast={t} onDismiss={dismiss} />)}
      </div>
    </ToastContext.Provider>
  );
}
