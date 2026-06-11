import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

export const TurnosCaja = () => {
  const { user, activeTurno, guardarTurnoActivo, limpiarTurnoActivo } = useAuth();
  const [cajas, setCajas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Campos para el formulario de Apertura
  const [idCajaSeleccionada, setIdCajaSeleccionada] = useState('');
  const [montoApertura, setMontoApertura] = useState('');

  // Campos para el formulario de Cierre
  const [montoCierre, setMontoCierre] = useState('');

  // 1. Cargar las cajas y verificar estados activos en frío al montar la pantalla
  useEffect(() => {
    const cargarCajasYVerificarTurno = async () => {
      try {
        const [resCajas, resTurnos] = await Promise.all([
          apiClient.get('/Cajas'),
          apiClient.get('/TurnosCaja')
        ]);

        setCajas(resCajas.data);

        if (resCajas.data.length > 0) {
          const cajaInicial = resCajas.data[0].idCaja;
          setIdCajaSeleccionada(cajaInicial);

          // 🛡️ AUTO-RECOVERY AL CARGAR: Si el context no tiene activeTurno pero la BD sí, lo recuperamos en silencio
          if (!activeTurno) {
            const turnoPreexistente = resTurnos.data.find(t => 
              t.idCaja === parseInt(cajaInicial) && (t.estado === "Abierto" || t.montoCierre === null || !t.fechaCierre)
            );
            if (turnoPreexistente) {
              guardarTurnoActivo(turnoPreexistente.idTurno);
            }
          }
        }
      } catch (err) {
        setError('No se pudieron sincronizar las configuraciones de las cajas físicas.');
      } finally {
        setLoading(false);
      }
    };
    cargarCajasYVerificarTurno();
  }, [activeTurno]);

  // 🛡️ EFECTO RECTIFICADOR: Si el usuario cambia manualmente de caja en el select, verificamos si esa otra caja tiene turno abierto
  useEffect(() => {
    if (!idCajaSeleccionada || loading) return;

    const verificarCambioCaja = async () => {
      try {
        const resTurnos = await apiClient.get('/TurnosCaja');
        const turnoDeCaja = resTurnos.data.find(t => 
          t.idCaja === parseInt(idCajaSeleccionada) && (t.estado === "Abierto" || t.montoCierre === null || !t.fechaCierre)
        );

        if (turnoDeCaja) {
          guardarTurnoActivo(turnoDeCaja.idTurno);
          setError('');
        } else {
          // Si la caja seleccionada no tiene turno, pero el estado global guardaba el de la otra, limpiamos para permitir apertura
          limpiarTurnoActivo();
        }
      } catch (err) {
        console.error("Error al rectificar turno por cambio de caja", err);
      }
    };
    verificarCambioCaja();
  }, [idCajaSeleccionada]);

  // 2. Procesar la Apertura del Turno (POST a /api/TurnosCaja/apertura)
  const handleApertura = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!idCajaSeleccionada) {
      setError('Por favor, seleccione una caja física.');
      return;
    }

    if (!montoApertura || parseFloat(montoApertura) < 0) {
      setError('Por favor, ingrese un monto de apertura válido.');
      return;
    }

    try {
      const response = await apiClient.post('/TurnosCaja/apertura', {
        idCaja: parseInt(idCajaSeleccionada),
        idUsuario: user.idUsuario, 
        montoApertura: parseFloat(montoApertura)
      });

      guardarTurnoActivo(response.data.idTurno);
      setSuccess('¡Caja abierta con éxito! Ya puede proceder al módulo de facturación.');
      setMontoApertura('');
    } catch (err) {
      const mensajeAPI = err.response?.data?.mensaje || '';

      if (mensajeAPI.includes("ya tiene un turno activo")) {
        try {
          const resTurnos = await apiClient.get('/TurnosCaja');
          const turnoExistente = resTurnos.data.find(t => 
            t.idCaja === parseInt(idCajaSeleccionada) && (t.estado === "Abierto" || t.montoCierre === null || !t.fechaCierre)
          );

          if (turnoExistente) {
            guardarTurnoActivo(turnoExistente.idTurno);
            setSuccess('Sincronización exitosa: Se enlazó el turno abierto detectado en el servidor.');
            setMontoApertura('');
            return;
          }
        } catch (fetchErr) {
          console.error("Fallo el intento secundario de recuperación", fetchErr);
        }
      }
      setError(mensajeAPI || 'Error al intentar abrir el turno.');
    }
  };

  // 3. Procesar el Cierre de Caja (POST a /api/TurnosCaja/cierre/{id})
  const handleCierre = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!montoCierre || parseFloat(montoCierre) < 0) {
      setError('Por favor, ingrese el monto final del arqueo.');
      return;
    }

    try {
      await apiClient.post(`/TurnosCaja/cierre/${activeTurno}?montoCierre=${montoCierre}`);
      
      limpiarTurnoActivo(); 
      setSuccess('Turno cerrado correctamente. ¡Buen trabajo!');
      setMontoCierre('');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al intentar efectuar el cierre.');
    }
  };

  if (loading) return <div style={styles.centered}>Cargando configuraciones contables...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>CONTROL DE TURNOS Y GAVETA</h2>
        <p style={styles.subtitle}>Operador actual: <strong>{user?.username}</strong></p>
        
        {error && <div style={styles.errorAlert}>{error}</div>}
        {success && <div style={styles.successAlert}>{success}</div>}

        {!activeTurno ? (
          <form onSubmit={handleApertura} style={styles.form}>
            <div style={styles.alertInfo}>⚠️ ATENCIÓN: Debe abrir un turno antes de poder vender.</div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Seleccionar Caja Física</label>
              <select 
                value={idCajaSeleccionada} 
                onChange={(e) => setIdCajaSeleccionada(e.target.value)}
                style={styles.input}
              >
                {cajas.map(caja => (
                  <option key={caja.idCaja} value={caja.idCaja}>
                    {caja.nombreCaja} ({caja.estado})
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Monto Inicial en Gaveta (C$)</label>
              <input 
                type="number" 
                placeholder="Ej: 1000.00" 
                value={montoApertura}
                onChange={(e) => setMontoApertura(e.target.value)}
                style={styles.input}
              />
            </div>

            <button type="submit" style={styles.btnApertura}>Abrir Turno de Caja</button>
          </form>
        ) : (
          <form onSubmit={handleCierre} style={styles.form}>
            <div style={styles.alertSuccess}>
              ✔️ CONFIGURACIÓN VÁLIDA: Usted tiene el turno <strong>N° {activeTurno}</strong> abierto y listo para facturar.
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Monto Final de Arqueo (Efectivo total en caja C$)</label>
              <input 
                type="number" 
                placeholder="Ej: 4500.00" 
                value={montoCierre}
                onChange={(e) => setMontoCierre(e.target.value)}
                style={styles.input}
              />
            </div>

            <button type="submit" style={styles.btnCierre}>Efectuar Cierre de Caja</button>
          </form>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '40px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' },
  card: { backgroundColor: '#ffffff', padding: '35px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', width: '100%', maxWidth: '550px', border: '1px solid #e2e8f0', textAlign: 'center' },
  title: { fontSize: '22px', fontWeight: '700', color: '#0f172a', marginBottom: '5px' },
  subtitle: { fontSize: '14px', color: '#64748b', marginBottom: '25px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#334155' },
  input: { padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px', backgroundColor: '#f8fafc', outline: 'none' },
  btnApertura: { backgroundColor: '#16a34a', color: '#fff', padding: '14px', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '10px' },
  btnCierre: { backgroundColor: '#dc2626', color: '#fff', padding: '14px', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '10px' },
  errorAlert: { backgroundColor: '#fee2e2', color: '#ef4444', padding: '12px', borderRadius: '6px', fontSize: '14px', textAlign: 'center', fontWeight: '500', border: '1px solid #fca5a5', marginBottom: '15px' },
  successAlert: { backgroundColor: '#dcfce7', color: '#16a34a', padding: '12px', borderRadius: '6px', fontSize: '14px', textAlign: 'center', fontWeight: '500', border: '1px solid #86efac', marginBottom: '15px' },
  alertInfo: { backgroundColor: '#fef3c7', color: '#d97706', padding: '12px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', border: '1px solid #fde68a' },
  alertSuccess: { backgroundColor: '#e0f2fe', color: '#0369a1', padding: '12px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', border: '1px solid #bae6fd' },
  centered: { textAlign: 'center', padding: '50px', fontSize: '16px', color: '#64748b' }
};