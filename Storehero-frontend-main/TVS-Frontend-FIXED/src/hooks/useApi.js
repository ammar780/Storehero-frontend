import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';

export function useApi(url, params, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: d } = await api.get(url, { params: paramsRef.current || {} });
      setData(d);
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      if (e.response?.status !== 401) setError(msg);
    } finally {
      setLoading(false);
    }
  }, [url, ...deps]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, refetch: load };
}
