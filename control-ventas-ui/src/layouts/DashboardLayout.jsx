import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const DashboardLayout = () => {
  const { user, logout, activeTurno } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      {/* SIDEBAR LATERAL IZQUIERDO */}
      <aside style={styles.sidebar}>
        <div style={styles.brandBox}>
          <h2 style={styles.brandText}>POS CONTROL</h2>
          <span style={styles.userBadge}>{user?.username || 'Operador'}</span>
        </div>

        <nav style={styles.navList}>
          <Link to="/dashboard" style={styles.navLink}>📊 Dashboard / Reportes</Link>
          <Link to="/reportes" style={styles.navLink}>🎯 Reportes Avanzados</Link>
          <Link to="/facturacion" style={styles.navLink}>🛒 Facturar Ventas</Link>
          <Link to="/turnos" style={styles.navLink}>💵 Control de Caja</Link>
          
          <div style={styles.divider} />
          <span style={styles.sectionHeader}>Inventario</span>
          <Link to="/productos" style={styles.navLink}>📦 Productos / Repuestos</Link>
          <Link to="/parametros" style={styles.navLink}>⚙️ Marcas y Categorías</Link>

          <div style={styles.divider} />
          <span style={styles.sectionHeader}>Configuración</span>
          <Link to="/cajas" style={styles.navLink}>🖥️ Configurar Cajas</Link>
        </nav>

        {/* ESTADO DEL TURNO EN TIEMPO REAL */}
        <div style={activeTurno ? styles.turnoOpen : styles.turnoClosed}>
          {activeTurno ? `🟢 Turno Activo: N° ${activeTurno}` : '🔴 Caja Cerrada'}
        </div>

        <button onClick={handleLogout} style={styles.btnLogout}>Cerrar Sesión 🚪</button>
      </aside>

      {/* CONTENIDO DINÁMICO A LA DERECHA */}
      <main style={styles.mainContent}>
        <header style={styles.topHeader}>
          <span>UNAN-León • Proyecto Integrador I</span>
          <strong>{new Date().toLocaleDateString()}</strong>
        </header>
        <div style={styles.pageWrapper}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: { display: 'flex', width: '100vw', minHeight: '100vh', overflow: 'hidden' },
  sidebar: { width: '260px', backgroundColor: 'var(--color-dark-primary)', display: 'flex', flexDirection: 'column', padding: '25px 20px', boxSizing: 'border-box' },
  brandBox: { marginBottom: '35px', textAlign: 'center' },
  brandText: { color: '#ffffff', fontSize: '22px', fontWeight: '700', letterSpacing: '1px', margin: 0 },
  userBadge: { display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--color-brand)', fontSize: '12px', padding: '4px 10px', borderRadius: '20px', marginTop: '8px', fontWeight: '600' },
  navList: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
  navLink: { color: '#cbd5e1', textDecoration: 'none', padding: '12px 15px', borderRadius: '6px', fontSize: '15px', fontWeight: '500', transition: 'all 0.2s', display: 'block' },
  divider: { height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '15px 0' },
  sectionHeader: { color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', paddingLeft: '15px', marginBottom: '5px' },
  mainContent: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-main)', height: '100vh', overflowY: 'auto' },
  topHeader: { height: '60px', backgroundColor: '#ffffff', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 30px', fontSize: '14px', color: 'var(--color-dark-secondary)' },
  pageWrapper: { padding: '30px', boxSizing: 'border-box' },
  btnLogout: { width: '100%', backgroundColor: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', marginTop: '20px' },
  turnoOpen: { backgroundColor: 'rgba(22, 163, 74, 0.15)', color: '#22c55e', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', textAlign: 'center', marginBottom: '10px' },
  turnoClosed: { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', textAlign: 'center', marginBottom: '10px' }
};