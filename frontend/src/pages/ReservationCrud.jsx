import { useNavigate, useParams } from "react-router-dom";
import { useReservas } from "@/features/reservations/hooks/useReservas";
import useAuthStore from "@/app/store/authStore";
import FormularioCrud from "../components/Formularios/FormularioCrud";
import FormularioDelete from "../components/Formularios/FormularioDelete";

function ReservationCrud({ modo }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = useAuthStore((state) => state.user);

  const {
    reservas,
    loading,
    error,
    agregarReserva,
    editarReserva,
    eliminarReserva,
  } = useReservas();

  const reserva = reservas.find((r) => String(r.id) === String(id));

  if (
    reserva &&
    user?.role !== "ADMIN" &&
    reserva.idUsuario !== user?.id
  ) {
    navigate("/unauthorized");
    return null;
  }

  async function onCrear(payload) {
    const result = await agregarReserva(payload);
    if (result.ok) navigate("/dashboard");
    return result;
  }

  async function onEditar(payload) {
    const result = await editarReserva(id, payload);
    if (result.ok) navigate("/dashboard");
    return result;
  }

  async function onEliminar() {
    const result = await eliminarReserva(id);
    if (result.ok) navigate("/dashboard");
    return result;
  }

  if (modo === "crear") {
    return (
      <FormularioCrud
        titulo="Nueva Reservación"
        subTitulo="Completa los datos"
        textoBoton="Guardar"
        onSubmitReserva={onCrear}
      />
    );
  }

  if (loading) return <p className="text-center py-8">Cargando...</p>;

  if (error || !reserva)
    return <p className="text-center text-red-500">Error o no encontrada</p>;

  if (modo === "actualizar") {
    return (

      <FormularioCrud
        titulo="Editar Reserva"
        subTitulo="Actualiza los datos"
        textoBoton="Actualizar"
        reserva={reserva}
        onSubmitReserva={onEditar}
      />
     
    );
  }

  return (
    <FormularioDelete
      titulo="Eliminar Reserva"
      subTitulo="Esta acción no se puede deshacer"
      textoBoton="Eliminar"
      reserva={reserva}
      onDeleteReserva={onEliminar}
    />
  );
}

export default ReservationCrud;