import api from './axios'

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login/', data),
  me: () => api.get('/auth/me/'),
  refresh: (data) => api.post('/auth/refresh/', data),
}

// ── Helper CRUD ───────────────────────────────────────────────────────────────
const crud = (path) => ({
  list: (params) => api.get(`/${path}/`, { params }),
  get: (id) => api.get(`/${path}/${id}/`),
  create: (data) => api.post(`/${path}/`, data),
  update: (id, d) => api.put(`/${path}/${id}/`, d),
  patch: (id, d) => api.patch(`/${path}/${id}/`, d),
  delete: (id) => api.delete(`/${path}/${id}/`),
})

// ── Usuarios y Sedes ──────────────────────────────────────────────────────────
export const usuariosAPI = crud('usuarios')
export const sedesAPI = crud('sedes')

// ── Configuración empresa ─────────────────────────────────────────────────────
export const configuracionAPI = {
  get: () => api.get('/configuracion/'),
  update: (data) => api.patch('/configuracion/', data),
}

// ── Clientes y Proveedores (con datos tributarios) ────────────────────────────
export const clientesAPI = crud('clientes')
export const proveedoresAPI = crud('proveedores')

// ── Productos ─────────────────────────────────────────────────────────────────
export const productosAPI = {
  ...crud('productos'),
  stockBodegas: (id) => api.get(`/productos/${id}/stock-bodegas/`),
  productosFinal: (params) => api.get('/productos/', { params: { ...params, tipo: 'TERMINADO' } }),
  productosMp: (params) => api.get('/productos/', { params: { ...params, tipo: 'MATERIA_PRIMA' } }),
  productosTimenda: (params) => api.get('/productos/', { params: { ...params, tipo: 'TIENDA' } }),
}

// ── Bodegas ───────────────────────────────────────────────────────────────────
export const bodegasAPI = {
  ...crud('bodegas'),
  stock: (params) => api.get('/bodegas/stock/', { params }),
  transferir: (data) => api.post('/bodegas/transferir/', data),
}

// ── Ventas ────────────────────────────────────────────────────────────────────
export const ventasAPI = {
  ...crud('ventas'),
  porSede: (sedeId) => api.get('/ventas/', { params: { sede: sedeId } }),
  porEmpleado: (userId) => api.get('/ventas/', { params: { responsable: userId } }),
  comisiones: (params) => api.get('/ventas/comisiones/', { params }),
}

// ── Facturación ───────────────────────────────────────────────────────────────
export const facturasAPI = {
  ...crud('facturas'),
  emitir: (id) => api.post(`/facturas/${id}/emitir/`),
  anular: (id, motivo) => api.post(`/facturas/${id}/anular/`, { motivo }),
  pdf: (id) => api.get(`/facturas/${id}/pdf/`, { responseType: 'blob' }),
  enviarEmail: (id) => api.post(`/facturas/${id}/enviar-email/`),
  calcularImpuestos: (data) => api.post('/facturas/calcular-impuestos/', data),
}

export const notasCreditoAPI = crud('notas-credito')

// ── Compras / Órdenes de compra ───────────────────────────────────────────────
export const comprasAPI = {
  ...crud('compras'),
  aprobar: (id) => api.post(`/compras/${id}/aprobar/`),
  rechazar: (id, data) => api.post(`/compras/${id}/rechazar/`, data),
  recibir: (id, data) => api.post(`/compras/${id}/recibir/`, data),
}

// ── Entregas / Logística ──────────────────────────────────────────────────────
export const entregasAPI = {
  ...crud('entregas'),
  actualizarEstado: (id, data) => api.patch(`/entregas/${id}/estado/`, data),
}

// ── Movimientos de inventario ─────────────────────────────────────────────────
export const movimientosAPI = {
  ...crud('movimientos'),
  traslado: (data) => api.post('/movimientos/traslado/', data),
  confirmar: (id) => api.post(`/movimientos/${id}/confirmar/`),
}

// ── Kardex ────────────────────────────────────────────────────────────────────
export const kardexAPI = {
  list: (params) => api.get('/kardex/', { params }),
  productos: () => api.get('/kardex/productos/'),
}

// ── RRHH / Empleados ──────────────────────────────────────────────────────────
export const empleadosAPI = {
  ...crud('empleados'),
  comisiones: (id, params) => api.get(`/empleados/${id}/comisiones/`, { params }),
}

// ── Nómina ────────────────────────────────────────────────────────────────────
export const nominaAPI = {
  periodos: crud('nomina/periodos'),
  lineas: crud('nomina/lineas'),
  novedades: crud('nomina/novedades'),
  cerrar: (id) => api.post(`/nomina/periodos/${id}/cerrar/`),
  generarComisiones: (id, data) => api.post(`/nomina/periodos/${id}/comisiones/`, data),
  colilla: (id, empId) => api.get(`/nomina/periodos/${id}/colilla/${empId}/`, { responseType: 'blob' }),
}

// ── CXC y CXP ────────────────────────────────────────────────────────────────
export const cxcAPI = {
  ...crud('cxc'),
  registrarPago: (data) => api.post('/cxc/pagos/', data),
  resumen: () => api.get('/cxc/resumen/'),
}

export const cxpAPI = {
  ...crud('cxp'),
  registrarPago: (data) => api.post('/cxp/pagos/', data),
  resumen: () => api.get('/cxp/resumen/'),
  porProveedor: () => api.get('/cxp/por-proveedor/'),
}

// ── Reportes ──────────────────────────────────────────────────────────────────
export const reportesAPI = {
  resumen: () => api.get('/reportes/resumen/'),
  ventasPorSede: (params) => api.get('/reportes/ventas-sede/', { params }),
  tributario: (params) => api.get('/reportes/tributario/', { params }),
  nomina: (params) => api.get('/reportes/nomina/', { params }),
}

// ── Tarifas tributarias ───────────────────────────────────────────────────────
export const tarifasAPI = {
  retefuente: () => api.get('/configuracion/tarifas-retefuente/'),
  reteica: (ciudad) => api.get('/configuracion/tarifas-reteica/', { params: { ciudad } }),
}