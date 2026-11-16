import { useCallback, useEffect, useState } from "react";
import { canchaService } from "@/features/canchas/services/canchaService";

const getErrorMessage = (err, fallback) =>
  typeof err === "string"
    ? err
    : err?.response?.data?.message || err?.response?.data?.error || err?.message || fallback;

export function useCanchas({ soloActivas = false } = {}) {
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCanchas = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = soloActivas ? await canchaService.getActivas() : await canchaService.getAll();
      setCanchas(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar las canchas"));
      setCanchas([]);
    } finally {
      setLoading(false);
    }
  }, [soloActivas]);

  useEffect(() => {
    fetchCanchas();
  }, [fetchCanchas]);

  return { canchas, loading, error, fetchCanchas };
}
