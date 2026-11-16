import { useMemo, useState } from "react";
import { toast } from "sonner";
import { canchaService } from "@/features/canchas/services/canchaService";
import { useCanchas } from "@/features/canchas/hooks/useCanchas";

const initialForm = { nombre: "", tipo: "FUTBOL_5", precioHora: "", activa: true, descripcion: "" };

function AdminCanchas() {
  const { canchas, loading, error, fetchCanchas } = useCanchas({ soloActivas: false });
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const stats = useMemo(() => ({
    total: canchas.length,
    activas: canchas.filter((c) => c.activa).length,
    inactivas: canchas.filter((c) => !c.activa).length,
  }), [canchas]);

  const formatMoney = (value) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(value || 0));

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const reset = () => { setForm(initialForm); setEditingId(null); };

  const edit = (cancha) => {
    setEditingId(cancha.id);
    setForm({
      nombre: cancha.nombre || "",
      tipo: cancha.tipo || "FUTBOL_5",
      precioHora: cancha.precioHora || "",
      activa: cancha.activa ?? true,
      descripcion: cancha.descripcion || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return toast.error("El nombre es obligatorio");
    if (!form.tipo.trim()) return toast.error("El tipo es obligatorio");
    if (!Number(form.precioHora) || Number(form.precioHora) <= 0) return toast.error("El precio debe ser mayor a cero");

    const payload = { ...form, precioHora: Number(form.precioHora), activa: Boolean(form.activa) };
    try {
      setSaving(true);
      if (editingId) {
        await canchaService.update(editingId, payload);
        toast.success("Cancha actualizada correctamente");
      } else {
        await canchaService.create(payload);
        toast.success("Cancha creada correctamente");
      }
      reset();
      fetchCanchas();
    } catch (err) {
      toast.error(err.message || "No se pudo guardar la cancha");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("¿Seguro que deseas eliminar esta cancha?")) return;
    try {
      await canchaService.remove(id);
      toast.success("Cancha eliminada");
      fetchCanchas();
    } catch (err) {
      toast.error(err.message || "No se pudo eliminar");
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Administración de Canchas</h1>
          <p className="page-subtitle">Crea, edita, activa o desactiva las canchas disponibles para reservas.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon"><span className="material-symbols-outlined">stadium</span></div><div><p className="stat-label">Total</p><p className="stat-value">{stats.total}</p></div></div>
        <div className="stat-card"><div className="stat-icon"><span className="material-symbols-outlined">check_circle</span></div><div><p className="stat-label">Activas</p><p className="stat-value">{stats.activas}</p></div></div>
        <div className="stat-card"><div className="stat-icon"><span className="material-symbols-outlined">build</span></div><div><p className="stat-label">Inactivas</p><p className="stat-value">{stats.inactivas}</p></div></div>
      </div>

      <div className="crud-card" style={{ marginBottom: 24 }}>
        <div className="crud-header">
          <div className="crud-header-icon"><span className="material-symbols-outlined">{editingId ? "edit" : "add"}</span></div>
          <div><h2 className="crud-header-title">{editingId ? "Editar cancha" : "Nueva cancha"}</h2><p className="crud-header-sub">Datos básicos de la cancha deportiva.</p></div>
        </div>
        <div className="crud-body">
          <form onSubmit={submit}>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Nombre</label><input className="form-input-plain" value={form.nombre} onChange={(e)=>handleChange("nombre", e.target.value)} placeholder="Cancha Sintética Norte" /></div>
              <div className="form-group"><label className="form-label">Tipo</label><select className="form-input-plain" value={form.tipo} onChange={(e)=>handleChange("tipo", e.target.value)}><option>FUTBOL_5</option><option>FUTBOL_7</option><option>FUTBOL_8</option><option>FUTBOL_11</option><option>MICROFUTBOL</option><option>VOLEY_PLAYA</option><option>BALONCESTO</option><option>TENIS</option><option>PADEL</option><option>MULTIPLE</option></select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Precio hora</label><input className="form-input-plain" type="number" value={form.precioHora} onChange={(e)=>handleChange("precioHora", e.target.value)} placeholder="45000" /></div>
              <div className="form-group"><label className="form-label">Estado</label><select className="form-input-plain" value={String(form.activa)} onChange={(e)=>handleChange("activa", e.target.value === "true")}><option value="true">Activa</option><option value="false">Inactiva</option></select></div>
            </div>
            <div className="form-group"><label className="form-label">Descripción</label><textarea className="form-input-plain" rows="3" value={form.descripcion} onChange={(e)=>handleChange("descripcion", e.target.value)} placeholder="Descripción de la cancha" /></div>
            <div className="form-actions"><button type="button" className="btn-secondary" onClick={reset}>Limpiar</button><button className="btn-primary" disabled={saving}>{saving ? "Guardando..." : editingId ? "Actualizar" : "Crear cancha"}</button></div>
          </form>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar"><span className="table-title">Listado de canchas</span><span className="table-count">{canchas.length} registros</span></div>
        <div className="table-scroll"><table className="reservas"><thead><tr><th>ID</th><th>Nombre</th><th>Tipo</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
          {loading && <tr><td colSpan="6">Cargando canchas...</td></tr>}
          {!loading && error && <tr><td colSpan="6">{error}</td></tr>}
          {!loading && !error && canchas.map((c)=>(<tr key={c.id}><td>#{c.id}</td><td><p className="cancha-name">{c.nombre}</p><p className="cancha-sub">{c.descripcion}</p></td><td>{c.tipo}</td><td>{formatMoney(c.precioHora)}</td><td><span className={`badge ${c.activa ? "badge-paid" : "badge-cancelled"}`}>{c.activa ? "Activa" : "Inactiva"}</span></td><td><div style={{display:"flex",gap:6}}><button className="action-btn" onClick={()=>edit(c)} title="Editar"><span className="material-symbols-outlined" style={{fontSize:16}}>edit</span></button><button className="action-btn danger" onClick={()=>remove(c.id)} title="Eliminar"><span className="material-symbols-outlined" style={{fontSize:16}}>delete</span></button></div></td></tr>))}
        </tbody></table></div>
      </div>
    </>
  );
}

export default AdminCanchas;
