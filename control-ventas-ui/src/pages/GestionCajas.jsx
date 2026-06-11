import { useState, useEffect } from 'react';
import apiClient from '../api/client';

export const GestionCajas = () => {
  const [cajas, setCajas] = useState([]);
  const [nuevaCaja, setNuevaCaja] = useState('');
  const [editandoCaja, setEditandoCaja] = useState(null);
  const [nombreEditCaja, setNombreEditCaja] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. Sincronizar las cajas físicas desde tu API en limpio
  const cargarCajas = async () => {
    try {
      const res = await apiClient.get('/Cajas');
      setCajas(res.data);
    } catch (err) {
      setError('Error al sincronizar el estado de las cajas físicas con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCajas();
  }, []);

  // 2. Operación: Insertar nueva Caja (POST a /api/Cajas)
  const handleGuardarCaja = async (e) => {
    e.preventDefault();
    if (!nuevaCaja.trim()) return;
    
    try {
      setError('');
      setSuccess('');
      
      await apiClient.post('/Cajas', { 
        nombreCaja: nuevaCaja,
        estado: 'CERRADA' // 👈 ¡Fijado aquí!
      });
      
      setNuevaCaja('');
      setSuccess('¡Nueva caja física registrada con éxito en el sistema!');
      await cargarCajas();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error crítico al intentar dar de alta la caja.');
    }
  };

  // 3. Operación: Modificar Nombre de Caja (PUT a /api/Cajas/{id})
  const handleActualizarCaja = async (id) => {
    if (!nombreEditCaja.trim()) return;
    
    // Buscamos la caja actual en nuestro estado para heredar su estado contable real ('ABIERTA' o 'CERRADA')
    const cajaActual = cajas.find(c => c.idCaja === id);
    const estadoOriginal = cajaActual ? cajaActual.estado : 'CERRADA';

    try {
      setError('');
      setSuccess('');
      
      await apiClient.put(`/Cajas/${id}`, { 
        idCaja: id, 
        nombreCaja: nombreEditCaja,
        estado: estadoOriginal // 👈 ¡Fijado aquí!
      });
      
      setEditandoCaja(null);
      setSuccess('El identificador de la caja fue modificado correctamente.');
      await cargarCajas();
    } catch (err) {
      setError('No se pudieron consolidar las modificaciones de la caja.');
    }
  };

  // 4. Operación: Baja Lógica Preventiva (DELETE a /api/Cajas/{id})
  const handleEliminarCaja = async (id) => {
    if (window.confirm('¿Está seguro de que desea dar de baja esta caja? Se aplicará un bloqueo lógico para proteger el historial de facturas en MySQL.')) {
      try {
        setError('');
        setSuccess('');
        await apiClient.delete(`/Cajas/${id}`);
        setSuccess('La caja física ha sido desactivada del flujo contable de forma exitosa.');
        await cargarCajas();
      } catch (err) {
        // Captura el portazo 'tieneTurnoActivo' que programamos en el controlador en C#
        setError(err.response?.data?.mensaje || 'La caja no puede ser dada de baja por integridad referencial.');
      }
    }
  };

  if (loading) return <div style={styles.centered}>Analizando hardware de cajas en la base de datos...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h3 style={styles.title}>🖥️ ADMINISTRACIÓN DE PUNTOS DE VENTA (CAJAS)</h3>
        
        {error && <div style={styles.errorAlert}>{error}</div>}
        {success && <div style={styles.successAlert}>{success}</div>}

        {/* FORMULARIO INLINE DE APERTURA EXPRESS */}
        <form onSubmit={handleGuardarCaja} style={styles.inlineForm}>
          <input 
            type="text" 
            placeholder="Ej: Caja Secundaria - Módulo Repuestos Moto..." 
            value={nuevaCaja} 
            onChange={e => setNuevaCaja(e.target.value)} 
            style={styles.input} 
          />
          <button type="submit" style={styles.btnAgregar}>+ Registrar</button>
        </form>

        {/* LISTADO DE CAJAS EN REGISTRO */}
        <ul style={styles.list}>
          {cajas.map(c => (
            <li key={c.idCaja} style={styles.listItem}>
              {editandoCaja === c.idCaja ? (
                <div style={styles.editRow}>
                  <input type="text" value={nombreEditCaja} onChange={e => setNombreEditCaja(e.target.value)} style={styles.inputSmall} />
                  <button onClick={() => handleActualizarCaja(c.idCaja)} style={styles.btnCheck}>✔️</button>
                  <button onClick={() => setEditandoCaja(null)} style={styles.btnCross}>❌</button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <strong style={{ color: 'var(--color-dark-primary)', fontWeight: '600' }}>
                      {c.nombreCaja}
                    </strong>
                    <span style={c.estado === 'ABIERTA' ? styles.badgeOpen : styles.badgeClosed}>
                      {c.estado}
                    </span>
                  </div>
                  <div style={styles.actions}>
                    <button onClick={() => { setEditandoCaja(c.idCaja); setNombreEditCaja(c.nombreCaja); }} style={styles.btnMiniEdit}>✏️</button>
                    {/* Ocultamos o deshabilitamos visualmente si está abierta por pura usabilidad */}
                    <button onClick={() => handleEliminarCaja(c.idCaja)} style={styles.btnMiniDel}>🗑️</button>
                  </div>
                </>
              )}
            </li>
          ))}
          {cajas.length === 0 && (
            <div style={styles.noData}>No hay terminales físicas registradas en este servidor.</div>
          )}
        </ul>
      </div>
    </div>
  );
};

const styles = {
  container: { width: '100%', padding: '10px 0' },
  card: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '12px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)', width: '100%', maxWidth: '650px', margin: 'auto' },
  title: { fontSize: '16px', fontWeight: '700', marginBottom: '20px', color: 'var(--color-dark-primary)', letterSpacing: '0.5px' },
  inlineForm: { display: 'flex', gap: '10px', marginBottom: '25px' },
  input: { flex: 1, padding: '11px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '14px', backgroundColor: '#f8fafc', outline: 'none', boxSizing: 'border-box' },
  inputSmall: { flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '13px', outline: 'none', backgroundColor: '#ffffff' },
  btnAgregar: { backgroundColor: 'var(--color-brand)', color: '#ffffff', border: 'none', padding: '0 20px', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9', fontSize: '14px' },
  editRow: { display: 'flex', gap: '8px', width: '100%' },
  actions: { display: 'flex', gap: '12px' },
  btnMiniEdit: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' },
  btnMiniDel: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' },
  btnCheck: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' },
  btnCross: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' },
  errorAlert: { backgroundColor: '#fee2e2', color: 'var(--color-danger)', padding: '11px', borderRadius: '6px', fontSize: '13px', marginBottom: '15px', border: '1px solid #fca5a5', textAlign: 'center', fontWeight: '500' },
  successAlert: { backgroundColor: '#dcfce7', color: 'var(--color-success)', padding: '11px', borderRadius: '6px', fontSize: '13px', marginBottom: '15px', border: '1px solid #86efac', textAlign: 'center', fontWeight: '500' },
  badgeOpen: { backgroundColor: '#dcfce7', color: '#16a34a', fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.5px' },
  badgeClosed: { backgroundColor: '#e2e8f0', color: '#475569', fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.5px' },
  centered: { textAlign: 'center', padding: '100px', fontSize: '15px', color: '#64748b' },
  noData: { textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }
};