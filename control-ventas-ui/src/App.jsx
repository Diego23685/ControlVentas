import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Facturacion } from './pages/Facturacion';
import { TurnosCaja } from './pages/TurnosCaja';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { ListaProductos } from './pages/productos/ListaProductos';
import { CrearProducto } from './pages/productos/CrearProducto';
import { EditarProducto } from './pages/productos/EditarProducto';
import { MarcasCategorias } from './pages/productos/MarcasCategorias';
import { GestionCajas } from './pages/GestionCajas'; 
import { Reportes } from './pages/Reportes';

// Componente guardián para proteger las pantallas si no hay login
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* RUTA PÚBLICA: AUTENTICACIÓN */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/facturacion" replace />} />

        {/* RUTAS PRIVADAS (Todas encapsuladas adentro del menú lateral y protegidas) */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          {/* Sub-rutas dinámicas */}
          <Route index element={<Navigate to="/facturacion" replace />} />
          <Route path="facturacion" element={<Facturacion />} />
          <Route path="turnos" element={<TurnosCaja />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="reportes" element={<SidebarWrapper title="Reportes Personalizados"><Reportes /></SidebarWrapper>} />
          
          {/* Módulo de Inventario/Productos */}
          <Route path="productos" element={<SidebarWrapper title="Inventario"><ListaProductos /></SidebarWrapper>} />
          <Route path="productos/crear" element={<SidebarWrapper title="Nuevo Repuesto"><CrearProducto /></SidebarWrapper>} />
          <Route path="productos/editar/:id" element={<SidebarWrapper title="Editar Repuesto"><EditarProducto /></SidebarWrapper>} />
          <Route path="parametros" element={<SidebarWrapper title="Marcas y Categorías"><MarcasCategorias /></SidebarWrapper>} />
          
          <Route path="cajas" element={<SidebarWrapper title="Administración de Cajas"><GestionCajas /></SidebarWrapper>} />
        </Route>

        {/* Capturar cualquier ruta inválida y redirigir */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// Pequeño componente envoltorio para que los títulos se vean nítidos
const SidebarWrapper = ({ children, title }) => (
  <div style={{ width: '100%' }}>
    <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      Mantenimiento / {title}
    </span>
    <div style={{ marginTop: '15px' }}>{children}</div>
  </div>
);

export default App;