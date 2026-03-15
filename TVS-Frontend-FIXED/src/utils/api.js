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

let isRefreshing = false;
let failedQueue = [];
const processQueue = (err, token) => { failedQueue.forEach(p => err ? p.reject(err) : p.resolve(token)); failedQueue = []; };

api.interceptors.response.use(
  (r) => r,
  async (e) => {
    const orig = e.config;
    if (e.response?.status === 401 && !orig._retry) {
      const rt = localStorage.getItem('tvs_refresh_token');
      if (rt && !orig.url?.includes('/auth/refresh')) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => { failedQueue.push({ resolve, reject }); })
            .then(token => { orig.headers.Authorization = 'Bearer ' + token; return api(orig); });
        }
        orig._retry = true; isRefreshing = true;
        try {
          const { data } = await axios.post((import.meta.env.VITE_API_URL || '') + '/api/auth/refresh', { refreshToken: rt });
          localStorage.setItem('tvs_token', data.token);
          if (data.refreshToken) localStorage.setItem('tvs_refresh_token', data.refreshToken);
          processQueue(null, data.token);
          orig.headers.Authorization = 'Bearer ' + data.token;
          return api(orig);
        } catch (re) {
          processQueue(re, null);
          localStorage.removeItem('tvs_token'); localStorage.removeItem('tvs_refresh_token');
          window.location.href = '/login';
          return Promise.reject(re);
        } finally { isRefreshing = false; }
      }
      localStorage.removeItem('tvs_token'); localStorage.removeItem('tvs_refresh_token');
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
