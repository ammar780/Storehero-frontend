import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/auth/check-setup');
        if (data.setupRequired) { setSetupRequired(true); setLoading(false); return; }
        const t = localStorage.getItem('tvs_token');
        if (!t) { setLoading(false); return; }
        const { data: u } = await api.get('/auth/me');
        setUser(u);
      } catch (e) {
        localStorage.removeItem('tvs_token');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('tvs_token', data.token);
    setUser(data.user);
  };

  const setup = async (email, password, name) => {
    const { data } = await api.post('/auth/setup', { email, password, name });
    localStorage.setItem('tvs_token', data.token);
    setUser(data.user);
    setSetupRequired(false);
  };

  const logout = () => { localStorage.removeItem('tvs_token'); setUser(null); };

  return (
    <AuthCtx.Provider value={{ user, loading, setupRequired, login, setup, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
