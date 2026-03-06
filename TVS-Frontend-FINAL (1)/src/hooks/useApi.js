import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export function useApi(url, params, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data: d } = await api.get(url, { params: params || {} });
      setData(d);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(params)]);

  useEffect(() => { load(); }, [load, ...deps]);
  return { data, loading, error, refetch: load };
}
