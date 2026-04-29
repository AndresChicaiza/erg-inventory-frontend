import api from './axios'

export const authAPI = {
  login: (data) => api.post('/auth/login/', data),
  me: () => api.get('/auth/me/'),
}

const crud = (path) => ({
  list: (params) => api.get(`/${path}/`, { params }),
  get: (id) => api.get(`/${path}/${id}/`),
  create: (data) => api.post(`/${path}/`, data),
  update: (id, d) => api.put(`/${path}/${id}/`, d),
  patch: (id, d) => api.patch(`/${path}/${id}/`, d),
  delete: (id) => api.delete(`/${path}/${id}/`),
})

export const usuariosAPI = crud('usuarios')
export const clientesAPI = crud('clientes')
export const proveedoresAPI = crud('proveedores')
export const ventasAPI = crud('ventas')
export const comprasAPI = crud('compras')
export const entregasAPI = crud('entregas')
export const movimientosAPI = crud('movimientos')

export const productosAPI = {
  ...crud('productos'),
  // Devuelve el stock de un producto desglosado por bodega
  stockBodegas: (id) => api.get(`/productos/${id}/stock-bodegas/`),
}

export const kardexAPI = {
  list: (params) => api.get('/kardex/', { params }),
  productos: () => api.get('/kardex/productos/'),
}

export const reportesAPI = {
  resumen: () => api.get('/reportes/resumen/'),
}

export const bodegasAPI = {
  ...crud('bodegas'),
  // Lista el stock de una bodega (filtrable por bodega_id y/o producto_id)
  stock: (params) => api.get('/bodegas/stock/', { params }),
  transferir: (data) => api.post('/bodegas/transferir/', data),
}

export const cxcAPI = {
  ...crud('cxc'),
  registrarPago: (data) => api.post('/cxc/pagos/', data),
}

export const cxpAPI = {
  ...crud('cxp'),
  registrarPago: (data) => api.post('/cxp/pagos/', data),
}

export const nominaAPI = {
  periodos: crud('nomina/periodos'),
  lineas: crud('nomina/lineas'),
  cerrar: (id) => api.post(`/nomina/periodos/${id}/cerrar/`),
}