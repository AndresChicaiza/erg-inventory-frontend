# ERG Inventory — Frontend

Interfaz administrativa moderna y dinámica para la gestión integral de ERG Inventory.

Tecnologías: **React + Vite + Vanilla CSS**.  
Deploy: **Vercel**.

---

## 🚀 Características Principales

- **Dashboard Inteligente:** KPIs en tiempo real, alertas de stock bajo, vencimientos de lotes y estados financieros.
- **Gestión Multi-bodega:** Interfaz para traslados entre bodegas con remisiones formales y recepción en destino.
- **Facturación Avanzada:** Formulario dinámico para emisión de facturas con múltiples impuestos y regímenes tributarios.
- **Control de Nómina:** Gestión de empleados y liquidación de períodos.
- **Diseño Premium:** Interfaz oscura (Dark Mode), responsive, con micro-animaciones y alta usabilidad.
- **RBAC Dinámico:** La interfaz se adapta según el rol del usuario (Administrador, Vendedor, Contador, Jefe de Fábrica, etc.).

---

## 📂 Estructura del Proyecto

```
src/
├── api/              ← Configuración de Axios y Endpoints
├── assets/           ← Imágenes y Logotipos
├── components/       ← Componentes reutilizables (Modales, Tablas, Sidebar)
├── context/          ← Estados globales (Auth, Alertas)
├── pages/            ← Páginas principales por módulo
│   ├── Facturacion/
│   ├── Nomina/
│   ├── Entregas/     ← Logística y Traslados
│   ├── Produccion/
│   └── ...
├── App.jsx           ← Enrutamiento y Rutas Protegidas
└── index.css         ← Sistema de diseño y variables globales
```

---

## 🛠️ Instalación Local

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Variables de Entorno:**
   Crea un archivo `.env` en la raíz:
   ```env
   VITE_API_URL=https://tu-backend-render.com/api
   ```

3. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```

---

## 🔐 Rutas Protegidas

El sistema utiliza un componente `RoleRoute` para restringir el acceso a módulos específicos según el perfil del usuario, redirigiendo automáticamente si no se tienen los permisos necesarios.

---

## 📦 Build para Producción

```bash
npm run build
```
La carpeta `dist` contendrá los archivos listos para ser desplegados en Vercel u otros servicios de hosting estático.

---

© 2026 ERG Inventory - Powered by ERG Inventory / Suministros Dacar SAS.
