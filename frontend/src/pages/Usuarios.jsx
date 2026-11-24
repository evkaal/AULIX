import { useCallback, useState } from 'react'
import { TriangleAlert, Users } from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'
import FormModal from '../components/FormModal'
import FormField from '../components/FormField'
import PasswordRules from '../components/PasswordRules'
import { DemoBanner, EmptyState, Loading, Pagination } from '../components/Shared'
import { usePaginated } from '../hooks/usePaginated'
import { apiGet, apiPost, apiPut, apiDelete, isDemo, normalizePage } from '../services/api'
import { validateEmail, validateStrongPassword } from '../services/validators'
import '../styles/pages.css'

// Gestión de usuarios. SOLO MODO DEMO: el backend real NO tiene ningún
// endpoint /api/usuarios (ver backend/README.md: solo DOCENTE y
// ESTUDIANTE, sin rol ADMIN y sin CRUD de usuarios). En modo real esta
// vista lo dice claro y no inventa usuarios; en modo demo sí permite
// crear/editar/eliminar usuarios de ejemplo (roles ADMIN/DOCENTE/ESTUDIANTE).
const emptyForm = { nombre: '', correo: '', password: '', rol: 'ESTUDIANTE' }
const tone = { ADMIN: 'purple', DOCENTE: 'blue', ESTUDIANTE: 'green' }
export default function Usuarios() {
  const fetcher = useCallback((p) => apiGet('/usuarios', p).then((d) => normalizePage(d, p.page, p.size)), [])
  const { status, items, totalElements, totalPages, page, setPage, search, setSearch, reload, error } = usePaginated(fetcher, { size: 10 })
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [notice, setNotice] = useState('')
  const openCreate = () => { setForm(emptyForm); setFormErrors({}); setModal({ mode: 'create' }) }
  const openEdit = (u) => { setForm({ nombre: u.nombre, correo: u.correo, password: '', rol: u.rol }); setFormErrors({}); setModal({ mode: 'edit', usuario: u }) }
  const validate = () => {
    const e = {}
    if (!form.nombre.trim() || form.nombre.trim().length < 3) e.nombre = 'Escribe el nombre completo.'
    e.correo = validateEmail(form.correo)
    if (modal?.mode === 'create') e.password = validateStrongPassword(form.password)
    else if (form.password) e.password = validateStrongPassword(form.password)
    setFormErrors(e); return !Object.values(e).some(Boolean)
  }
  const save = async (e) => {
    e.preventDefault(); if (!validate()) return
    setSaving(true)
    try {
      if (modal.mode === 'create') { await apiPost('/usuarios', { nombre: form.nombre.trim(), correo: form.correo.trim(), password: form.password, rol: form.rol }); setNotice('Usuario creado.') }
      else { const body = { nombre: form.nombre.trim(), correo: form.correo.trim(), rol: form.rol }; if (form.password) body.password = form.password; await apiPut(`/usuarios/${modal.usuario.id}`, body); setNotice('Usuario actualizado.') }
      setModal(null); reload()
    } catch (err) { setFormErrors({ general: err.message }) } finally { setSaving(false) }
  }
  const remove = async () => { try { await apiDelete(`/usuarios/${confirmDelete.id}`); setNotice('Usuario eliminado.'); setConfirmDelete(null); reload() } catch (err) { setNotice(err.message) } }
  return (
    <>
      <DemoBanner />
      <div className="page-head"><div><h1 className="page-title">Usuarios</h1><p className="page-subtitle">Gestión de usuarios y roles. Solo el administrador puede ver esta sección.</p></div>
        {isDemo() && <button type="button" className="btn btn--primary" onClick={openCreate}><Users size={16} /> Nuevo usuario</button>}
      </div>
      {!isDemo() && (
        <div className="alert alert--info" role="status"><TriangleAlert size={18} /><span><strong>Solo disponible en modo demo.</strong> El backend real no tiene endpoint de usuarios ni rol de administrador (solo DOCENTE y ESTUDIANTE). Activa el modo demo con <code>VITE_DEMO_MODE=true</code> para probar esta vista, o pide a tu compañero que añada el módulo de usuarios al backend.</span></div>
      )}
      {notice && <div className="alert alert--info" role="status"><span>{notice}</span><button type="button" className="btn btn--ghost btn--sm" onClick={() => setNotice('')}>Cerrar</button></div>}
      <div className="toolbar" style={{ marginBottom: 12 }}>
        <label className="search"><input type="search" placeholder="Buscar por nombre o correo…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar usuario" /></label>
      </div>
      {status === 'loading' && <Loading label="Cargando usuarios…" />}
      {status === 'error' && <div className="alert alert--error" role="alert"><span>{error}</span><button type="button" className="btn btn--ghost btn--sm" onClick={reload}>Reintentar</button></div>}
      {status === 'ready' && items.length === 0 && <EmptyState title="Aún no hay usuarios" text="Crea el primer usuario para empezar." />}
      {status === 'ready' && items.length > 0 && (
        <>
          <div className="table-wrap"><table className="table"><thead><tr><th>NOMBRE</th><th>CORREO</th><th>ROL</th><th></th></tr></thead>
            <tbody>{items.map((u) => (
              <tr key={u.id}><td><strong>{u.nombre}</strong></td><td>{u.correo}</td><td><span className={`badge badge--${tone[u.rol] || 'blue'}`}>{u.rol === 'ESTUDIANTE' ? 'Estudiante' : u.rol === 'DOCENTE' ? 'Docente' : 'Administrador'}</span></td>
                <td><span className="row-actions"><button type="button" className="btn btn--ghost btn--sm" onClick={() => openEdit(u)}>Editar</button><button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirmDelete(u)}>Eliminar</button></span></td></tr>
            ))}</tbody></table></div>
          <Pagination page={page} totalPages={totalPages} totalElements={totalElements} onPage={setPage} />
        </>
      )}
      <FormModal open={!!modal} title={modal?.mode === 'create' ? 'Nuevo usuario' : 'Editar usuario'} onClose={() => setModal(null)} onSubmit={save} submitLabel={modal?.mode === 'create' ? 'Crear usuario' : 'Guardar cambios'} loading={saving}>
        {formErrors.general && <div className="alert alert--error" role="alert"><span>{formErrors.general}</span></div>}
        <FormField label="Nombre completo" name="nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} error={formErrors.nombre} />
        <FormField label="Correo electrónico" name="correo" type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} error={formErrors.correo} />
        <div><FormField label={modal?.mode === 'create' ? 'Contraseña' : 'Nueva contraseña (opcional)'} name="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={formErrors.password} /><PasswordRules value={form.password} /></div>
        <div className="field"><label className="field__label" htmlFor="rol-usuario">Rol</label><select id="rol-usuario" className="select" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}><option value="ESTUDIANTE">Estudiante</option><option value="DOCENTE">Docente</option><option value="ADMIN">Administrador</option></select></div>
      </FormModal>
      <ConfirmModal open={!!confirmDelete} title="¿Eliminar usuario?" message={`Se eliminará a ${confirmDelete?.nombre} (${confirmDelete?.correo}). Esta acción no se puede deshacer.`} confirmLabel="Eliminar" danger onCancel={() => setConfirmDelete(null)} onConfirm={remove} />
    </>
  )
}
