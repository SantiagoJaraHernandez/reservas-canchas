import { useEffect, useState } from "react";
import { toast } from "sonner";
import { usuarioService } from "@/features/usuarios/services/usuarioService";

function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await usuarioService.getAll();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsuarios(); }, []);

  const cambiarRol = async (usuario) => {
    const nuevoRol = usuario.rol === "ADMIN" ? "USER" : "ADMIN";
    if (!confirm(`¿Cambiar el rol de ${usuario.email} a ${nuevoRol}?`)) return;
    try {
      await usuarioService.updateRole(usuario.id, nuevoRol);
      toast.success("Rol actualizado");
      fetchUsuarios();
    } catch (err) {
      toast.error(err.message || "No se pudo actualizar el rol");
    }
  };

  return (
    <>
      <div className="page-header"><div><h1 className="page-title">Usuarios</h1><p className="page-subtitle">Consulta los usuarios registrados y administra sus roles.</p></div></div>
      <div className="table-card">
        <div className="table-toolbar"><span className="table-title">Listado de usuarios</span><span className="table-count">{usuarios.length} registros</span></div>
        <div className="table-scroll"><table className="reservas"><thead><tr><th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Fecha creación</th><th>Acciones</th></tr></thead><tbody>
          {loading && <tr><td colSpan="6">Cargando usuarios...</td></tr>}
          {!loading && error && <tr><td colSpan="6">{error}</td></tr>}
          {!loading && !error && usuarios.map((u)=>(
            <tr key={u.id}>
              <td><span className="reserva-id">{u.id?.slice(0,8)}...</span></td>
              <td>{u.nombre || "—"}</td>
              <td>{u.email}</td>
              <td><span className={`role-badge ${u.rol === "ADMIN" ? "admin" : "user"}`}>{u.rol}</span></td>
              <td>{u.fechaCreacion ? new Date(u.fechaCreacion).toLocaleString("es-CO") : "—"}</td>
              <td><button className="btn-secondary" onClick={()=>cambiarRol(u)}>Cambiar a {u.rol === "ADMIN" ? "USER" : "ADMIN"}</button></td>
            </tr>
          ))}
        </tbody></table></div>
      </div>
    </>
  );
}

export default AdminUsuarios;
