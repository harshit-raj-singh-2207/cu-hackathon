import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../services/api';

/**
 * Generic data-fetching hook that wraps apiRequest.
 *
 * @param {string} path  - API path (e.g. '/jobs/recommendations')
 * @param {object} [options] - { method, body, immediate, dependencies }
 */
export default function useFetch(path, options = {}) {
  const { method = 'GET', body = null, immediate = true, dependencies = [] } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (overridePath, overrideOptions) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiRequest(overridePath || path, {
        method,
        body: body ? JSON.stringify(body) : undefined,
        ...overrideOptions,
      });
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || 'Request failed');
      throw err;
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, method, ...dependencies]);

  useEffect(() => {
    if (immediate) {
      execute().catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, execute]);

  return { data, loading, error, execute, setData };
}
