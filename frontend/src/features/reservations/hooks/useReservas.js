import { useEffect, useState, useCallback } from "react";
import { reservaService } from "@/features/reservations/services/reservaService";
import { toast } from "sonner";
import { useAsync } from "@/core/hooks/useAsync";

export function useReservas() {
  const [reservas, setReservas] = useState([]);
  const [loadingFetch, setLoadingFetch] = useState(true);
  const [error, setError] = useState("");

  const createAsync = useAsync(reservaService.create);
  const updateAsync = useAsync(reservaService.update);
  const deleteAsync = useAsync(reservaService.delete);

  const getErrorMessage = (err, fallback) => {
    if (typeof err === "string") return err;

    return (
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message ||
      fallback
    );
  };

  const fetchReservas = useCallback(async () => {
    try {
      setLoadingFetch(true);
      setError("");

      const data = await reservaService.getAll();
      setReservas(data);
    } catch (err) {
      const msg = getErrorMessage(err, "No se pudieron cargar las reservas");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoadingFetch(false);
    }
  }, []);

  useEffect(() => {
    fetchReservas();
  }, [fetchReservas]);

  const agregarReserva = async (payload) => {
    const result = await createAsync.execute(payload);

    if (result.ok) {
      setReservas((prev) => [...prev, result.data]);
      toast.success("Reserva creada correctamente");
    } else {
      toast.error(result.message);
    }

    return result;
  };

  const editarReserva = async (id, payload) => {
    const result = await updateAsync.execute(id, payload);

    if (result.ok) {
      setReservas((prev) =>
        prev.map((r) => (r.id === id ? result.data : r))
      );
      toast.success("Reserva actualizada");
    } else {
      toast.error(result.message);
    }

    return result;
  };

  const eliminarReserva = async (id) => {
    const result = await deleteAsync.execute(id);

    if (result.ok) {
      setReservas((prev) => prev.filter((r) => r.id !== id));
      toast.success("Reserva eliminada");
    } else {
      toast.error(result.message);
    }

    return result;
  };

  const loading =
    loadingFetch ||
    createAsync.loading ||
    updateAsync.loading ||
    deleteAsync.loading;

  return {
    reservas,
    loading,
    error,
    fetchReservas,
    agregarReserva,
    editarReserva,
    eliminarReserva,
  };
}