import { useState, useEffect } from "react";
import useAuthStore from "@/app/store/authStore";
import { reservaService } from "@/features/reservations/services/reservaService";

export function useFormReservas(reserva, onSubmitReserva) {
  const user = useAuthStore((state) => state.user);

  const [formData, setFormData] = useState({
    id: reserva?.id ?? null,
    idCancha: reserva?.idCancha ?? "",
    fecha: reserva?.fecha ?? "",
    horaInicio: reserva?.horaInicio ?? "",
    horaFin: reserva?.horaFin ?? "",
  });

  const [horariosOcupados, setHorariosOcupados] = useState([]);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [errorApi, setErrorApi] = useState("");

  useEffect(() => {
    async function cargarHorarios() {
      if (!formData.idCancha || !formData.fecha) return;

      try {
        const data = await reservaService.getAll();

        const ocupados = data.filter(
          (r) =>
            r.id !== formData.id &&
            r.idCancha === Number(formData.idCancha) &&
            r.fecha === formData.fecha
        );

        setHorariosOcupados(ocupados);
      } catch (e) {
        console.error("Error cargando horarios:", e);
      }
    }

    cargarHorarios();
  }, [formData.idCancha, formData.fecha]);

  function validar() {
    const nuevosErrores = {};

    if (!formData.idCancha) nuevosErrores.idCancha = "Debes seleccionar una cancha";
    if (!formData.fecha) nuevosErrores.fecha = "La fecha es obligatoria";
    if (!formData.horaInicio) nuevosErrores.horaInicio = "Hora inicio requerida";
    if (!formData.horaFin) nuevosErrores.horaFin = "Hora fin requerida";

    if (
      formData.horaInicio &&
      formData.horaFin &&
      formData.horaFin <= formData.horaInicio
    ) {
      nuevosErrores.horaFin = "La hora de fin debe ser posterior a la hora de inicio";
    }

    const hoy = new Date().toISOString().split("T")[0];
    if (formData.fecha < hoy) {
      nuevosErrores.fecha = "No puedes reservar en fechas pasadas";
    }

    const conflicto = horariosOcupados.some((r) => {
      return (
        formData.horaInicio < r.horaFin &&
        formData.horaFin > r.horaInicio
      );
    });

    if (conflicto) {
      nuevosErrores.horaInicio = "Horario ya ocupado";
      nuevosErrores.horaFin = "Horario ya ocupado";
    }

    return nuevosErrores;
  }

  function handleChange(campo, valor) {
    setFormData((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => ({ ...prev, [campo]: "" }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorApi("");

    const erroresEncontrados = validar();
    if (Object.keys(erroresEncontrados).length > 0) {
      setErrores(erroresEncontrados);
      return { ok: false };
    }

    setEnviando(true);

    const payload = {
      idCancha: Number(formData.idCancha),
      fecha: formData.fecha,
      horaInicio: `${formData.horaInicio}:00`,
      horaFin: `${formData.horaFin}:00`,
      idUsuario: user?.id,
      estado: "PENDIENTE",
      fechaCreacion: new Date().toISOString(),
    };

    if (formData.id) {
      payload.id = formData.id;
    }

    const resultado = await onSubmitReserva(payload);

    setEnviando(false);

    if (!resultado.ok) {
      setErrorApi(resultado.message);
    }

    return resultado;
  }

  return {
    formData,
    handleChange,
    errores,
    errorApi,
    enviando,
    handleSubmit,
    horariosOcupados,
  };
}