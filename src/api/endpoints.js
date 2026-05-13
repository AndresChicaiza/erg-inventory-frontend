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

// ── Clientes y Proveedores ────────────────────────────────────────────────────
export const clientesAPI = crud('clientes')
export const proveedoresAPI = crud('proveedores')

// ── Productos ─────────────────────────────────────────────────────────────────
export const productosAPI = {
  ...crud('productos'),
  stockBodegas: (id) => api.get(`/productos/${id}/stock-bodegas/`),
}

// ── Bodegas ───────────────────────────────────────────────────────────────────
export const bodegasAPI = {
  ...crud('bodegas'),
  stock: (params) => api.get('/bodegas/stock/', { params }),
  transferir: (data) => api.post('/bodegas/transferir/', data),
}

// ── Facturación ───────────────────────────────────────────────────────────────
export const facturasAPI = {
  ...crud('facturas'),

  // Resumen para dashboard
  resumen: () => api.get('/facturas/resumen/'),

  // Cálculo de impuestos sin guardar
  calcularImpuestos: (data) => api.post('/facturas/calcular-impuestos/', data),

  // Emitir / anular / pagar
  emitir: (id) => api.post(`/facturas/${id}/emitir/`),
  anular: (id, motivo) => api.post(`/facturas/${id}/anular/`, { motivo }),
  pagar: (id) => api.post(`/facturas/${id}/pagar/`),

  // PDF — respuesta blob
  pdf: (id) => api.get(`/facturas/${id}/pdf/`, { responseType: 'blob' }),

  // Detalles (ítems) de una factura
  getDetalles: (facturaId) => api.get(`/facturas/${facturaId}/detalles/`),
  createDetalle: (facturaId, data) => api.post(`/facturas/${facturaId}/detalles/`, data),
  deleteDetalles: (facturaId) => api.delete(`/facturas/${facturaId}/detalles/`),
  updateDetalle: (id, data) => api.patch(`/facturas/detalles/${id}/`, data),
  deleteDetalle: (id) => api.delete(`/facturas/detalles/${id}/`),
}

// ── Notas crédito ─────────────────────────────────────────────────────────────
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

// ── Movimientos ───────────────────────────────────────────────────────────────
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

// ── CXC ───────────────────────────────────────────────────────────────────────
export const cxcAPI = {
  ...crud('cxc'),
  registrarPago: (data) => api.post('/cxc/pagos/', data),
  resumen: () => api.get('/cxc/resumen/'),
}

// ── CXP ───────────────────────────────────────────────────────────────────────
export const cxpAPI = {
  ...crud('cxp'),
  registrarPago: (data) => api.post('/cxp/pagos/', data),
  resumen: () => api.get('/cxp/resumen/'),
  porProveedor: () => api.get('/cxp/por-proveedor/'),
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
}

// ── Reportes ──────────────────────────────────────────────────────────────────
export const reportesAPI = {
  resumen: () => api.get('/reportes/resumen/'),
  ventasPorSede: (params) => api.get('/reportes/ventas-sede/', { params }),
  tributario: (params) => api.get('/reportes/tributario/', { params }),
}

// ── Tarifas tributarias ───────────────────────────────────────────────────────
export const tarifasAPI = {
  retefuente: () => api.get('/configuracion/tarifas-retefuente/'),
  reteica: (ciudad) => api.get('/configuracion/tarifas-reteica/', { params: { ciudad } }),
}

// ── Producción ─────────────────────────────────────────────────────────────────
export const produccionAPI = {
  recetas: {
    ...crud('produccion/recetas'),
    ingredientes: (recetaId) => ({
      ...crud(`produccion/recetas/${recetaId}/ingredientes`),
    })
  },
  ordenes: {
    ...crud('produccion/ordenes'),
    completar: (id, consumos) => api.post(`/produccion/ordenes/${id}/completar/`, { consumos }),
  }
}