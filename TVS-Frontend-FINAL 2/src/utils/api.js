import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || '') + '/api',
  timeout: 30000,
});

api.interceptors.request.use((c) => {
  const t = localStorage.getItem('tvs_token');
  if (t) c.headers.Authorization = 'Bearer ' + t;
  return c;
});

api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401) {
      localStorage.removeItem('tvs_token');
      window.location.href = '/login';
    }
    return Promise.reject(e);
  }
);

export default api;

export const fmt = {
  currency: (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0),
  currencyExact: (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v || 0),
  number: (v) => new Intl.NumberFormat('en-US').format(v || 0),
  compact: (v) => {
    const n = +(v) || 0;
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toFixed(0);
  },
  pct: (v) => (+(v) || 0).toFixed(1) + '%',
  x: (v) => (+(v) || 0).toFixed(1) + 'x',
  change: (cur, prev) => {
    if (!prev || +prev === 0) return { pct: 0, dir: 'flat' };
    const p = ((+cur - +prev) / Math.abs(+prev)) * 100;
    return { pct: Math.round(p * 10) / 10, dir: p > 0.5 ? 'up' : p < -0.5 ? 'down' : 'flat' };
  },
};
