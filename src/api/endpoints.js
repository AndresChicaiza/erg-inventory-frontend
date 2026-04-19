import api from './axios'

export const authAPI = {
  login: (data) => api.post('/auth/login/', data),
  me:    ()     => api.get('/auth/me/'),
}

const crud = (path) => ({
  list:   (params) => api.get(`/${path}/`, { params }),
  get:    (id)     => api.get(`/${path}/${id}/`),
  create: (data)   => api.post(`/${path}/`, data),
  update: (id, d)  => api.put(`/${path}/${id}/`, d),
  patch:  (id, d)  => api.patch(`/${path}/${id}/`, d),
  delete: (id)     => api.delete(`/${path}/${id}/`),
})

export const usuariosAPI    = crud('usuarios')
export const productosAPI   = crud('productos')
export const clientesAPI    = crud('clientes')
export const proveedoresAPI = crud('proveedores')
export const ventasAPI      = crud('ventas')
export const comprasAPI     = crud('compras')
export const entregasAPI    = crud('entregas')
export const movimientosAPI = crud('movimientos')

export const kardexAPI = {
  list:      (params) => api.get('/kardex/', { params }),
  productos: ()       => api.get('/kardex/productos/'),
}

export const reportesAPI = {
  resumen: () => api.get('/reportes/resumen/'),
}
