import { useState, useCallback } from "react";

export function useAsync(asyncFunction) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...params) => {
    setLoading(true);
    setError(null);

    try {
      const data = await asyncFunction(...params);
      return { ok: true, data };
    } catch (err) {
      const message = err?.message || "Error inesperado";

      setError(message);

      return { ok: false, message };
    } finally {
      setLoading(false);
    }
  }, [asyncFunction]);

  return { execute, loading, error };
}