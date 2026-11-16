import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import useAuthStore from "@/app/store/authStore";
import { pagoService } from "@/features/pagos/services/pagoService";

const initialForm = { idReserva: "", monto: "", metodoPago: "NEQUI", aprobar: true };

function Pagos() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);

  const fetchPagos = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await pagoService.getAll();
      setPagos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los pagos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPagos(); }, []);

  const resumen = useMemo(() => ({
    total: pagos.length,
    aprobados: pagos.filter(p => p.estado === "APROBADO").length,
    rechazados: pagos.filter(p => p.estado === "RECHAZADO").length,
  }), [pagos]);

  const money = (v) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(v || 0));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.idReserva || !form.monto) return toast.error("Reserva y monto son obligatorios");
    try {
      await pagoService.simular({ idReserva: Number(form.idReserva), monto: Number(form.monto), metodoPago: form.metodoPago, aprobar: Boolean(form.aprobar) });
      toast.success("Pago simulado correctamente");
      setForm(initialForm);
      fetchPagos();
    } catch (err) {
      toast.error(err.message || "No se pudo simular el pago");
    }
  };

  return (
    <>
      <div className="page-header"><div><h1 className="page-title">Pagos</h1><p className="page-subtitle">Simulación de pagos para reservas. {isAdmin ? "Como ADMIN ves todos los pagos." : "Como USER ves solo tus pagos."}</p></div></div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon"><span className="material-symbols-outlined">payments</span></div><div><p className="stat-label">Total</p><p className="stat-value">{resumen.total}</p></div></div>
        <div className="stat-card"><div className="stat-icon"><span className="material-symbols-outlined">check_circle</span></div><div><p className="stat-label">Aprobados</p><p className="stat-value">{resumen.aprobados}</p></div></div>
        <div className="stat-card"><div className="stat-icon"><span className="material-symbols-outlined">cancel</span></div><div><p className="stat-label">Rechazados</p><p className="stat-value">{resumen.rechazados}</p></div></div>
      </div>

      <div className="crud-card" style={{ marginBottom: 24 }}><div className="crud-header"><div className="crud-header-icon"><span className="material-symbols-outlined">add_card</span></div><div><h2 className="crud-header-title">Simular pago</h2><p className="crud-header-sub">Registra un pago de prueba asociado a una reserva.</p></div></div><div className="crud-body"><form onSubmit={submit}><div className="form-row"><div className="form-group"><label className="form-label">ID Reserva</label><input className="form-input-plain" type="number" value={form.idReserva} onChange={(e)=>setForm({...form,idReserva:e.target.value})} /></div><div className="form-group"><label className="form-label">Monto</label><input className="form-input-plain" type="number" value={form.monto} onChange={(e)=>setForm({...form,monto:e.target.value})} /></div></div><div className="form-row"><div className="form-group"><label className="form-label">Método</label><select className="form-input-plain" value={form.metodoPago} onChange={(e)=>setForm({...form,metodoPago:e.target.value})}><option>NEQUI</option><option>DAVIPLATA</option><option>TARJETA</option><option>EFECTIVO</option><option>PSE</option></select></div><div className="form-group"><label className="form-label">Resultado</label><select className="form-input-plain" value={String(form.aprobar)} onChange={(e)=>setForm({...form,aprobar:e.target.value === "true"})}><option value="true">Aprobar</option><option value="false">Rechazar</option></select></div></div><div className="form-actions"><button className="btn-primary">Simular pago</button></div></form></div></div>

      <div className="table-card"><div className="table-toolbar"><span className="table-title">Historial de pagos</span><span className="table-count">{pagos.length} registros</span></div><div className="table-scroll"><table className="reservas"><thead><tr><th>Referencia</th><th>Reserva</th><th>Usuario</th><th>Método</th><th>Monto</th><th>Estado</th><th>Fecha</th></tr></thead><tbody>
        {loading && <tr><td colSpan="7">Cargando pagos...</td></tr>}
        {!loading && error && <tr><td colSpan="7">{error}</td></tr>}
        {!loading && !error && pagos.map((p)=>(<tr key={p.id}><td><span className="reserva-id">{p.referencia}</span></td><td>#{p.idReserva}</td><td>{p.emailUsuario || p.idUsuario || "—"}</td><td>{p.metodoPago}</td><td>{money(p.monto)}</td><td><span className={`badge ${p.estado === "APROBADO" ? "badge-paid" : "badge-cancelled"}`}>{p.estado}</span></td><td>{p.fechaCreacion ? new Date(p.fechaCreacion).toLocaleString("es-CO") : "—"}</td></tr>))}
      </tbody></table></div></div>
    </>
  );
}

export default Pagos;
