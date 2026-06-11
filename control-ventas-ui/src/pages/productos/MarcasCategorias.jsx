import { useState, useEffect } from 'react';
import apiClient from '../../api/client';

export const MarcasCategorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [nuevaCat, setNuevaCat] = useState('');
  const [nuevaMar, setNuevaMar] = useState('');
  const [editandoCat, setEditandoCat] = useState(null);
  const [editandoMar, setEditandoMar] = useState(null);
  const [nombreEditCat, setNombreEditCat] = useState('');
  const [nombreEditMar, setNombreEditMar] = useState('');
  const [error, setError] = useState('');

  const cargarDatos = async () => {
    try {
      const [resCat, resMar] = await Promise.all([
        apiClient.get('/Categorias'),
        apiClient.get('/Marcas')
      ]);
      setCategorias(resCat.data);
      setMarcas(resMar.data);
    } catch (err) {
      setError('Error al sincronizar catálogos.');
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // ==========================================
  // --- OPERACIONES CATEGORÍAS CORREGIDAS ---
  // ==========================================
  const handleGuardarCat = async (e) => {
    e.preventDefault();
    if (!nuevaCat.trim()) return;
    try {
      setError('');
      await apiClient.post('/Categorias', { NombreCategoria: nuevaCat, estado: true });
      setNuevaCat('');
      cargarDatos();
    } catch (err) { 
      setError(err.response?.data?.mensaje || 'Error al crear la categoría.'); 
    }
  };

  const handleActualizarCat = async (id) => {
    try {
      setError('');
      await apiClient.put(`/Categorias/${id}`, { 
        idCategoria: id, 
        NombreCategoria: nombreEditCat, 
        estado: true 
      });
      setEditandoCat(null);
      cargarDatos();
    } catch (err) { 
      setError(err.response?.data?.mensaje || 'Error al actualizar categoría.'); 
    }
  };

  const handleEliminarCat = async (id) => {
    if (window.confirm('¿Desea eliminar esta categoría?')) {
      try { 
        setError('');
        await apiClient.delete(`/Categorias/${id}`); 
        cargarDatos(); 
      } catch (err) { 
        setError(err.response?.data?.mensaje || 'No se puede eliminar, tiene productos amarrados.'); 
      }
    }
  };

  // ==========================================
  // --- OPERACIONES MARCAS CORREGIDAS ---
  // ==========================================
  const handleGuardarMar = async (e) => {
    e.preventDefault();
    if (!nuevaMar.trim()) return;
    try {
      setError('');
      await apiClient.post('/Marcas', { NombreMarca: nuevaMar, estado: true });
      setNuevaMar('');
      cargarDatos();
    } catch (err) { 
      setError(err.response?.data?.mensaje || 'Error al crear la marca.'); 
    }
  };

  const handleActualizarMar = async (id) => {
    try {
      setError('');
      await apiClient.put(`/Marcas/${id}`, { 
        idMarca: id, 
        NombreMarca: nombreEditMar, 
        estado: true 
      });
      setEditandoMar(null);
      cargarDatos();
    } catch (err) { 
      setError(err.response?.data?.mensaje || 'Error al actualizar marca.'); 
    }
  };

  const handleEliminarMar = async (id) => {
    if (window.confirm('¿Desea eliminar esta marca?')) {
      try { 
        setError('');
        await apiClient.delete(`/Marcas/${id}`); 
        cargarDatos(); 
      } catch (err) { 
        setError(err.response?.data?.mensaje || 'No se puede eliminar, tiene productos amarrados.'); 
      }
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <h2 style={styles.pageTitle}>⚙️ CONFIGURACIÓN DE PARÁMETROS</h2>
      {error && <div style={styles.errorAlert}>{error}</div>}

      <div style={styles.flexGrid}>
        {/* COLUMNA CATEGORÍAS */}
        <div style={styles.colCard}>
          <h3 style={styles.sectionTitle}>📁 Categorías de Repuestos</h3>
          <form onSubmit={handleGuardarCat} style={styles.inlineForm}>
            <input type="text" placeholder="Nueva categoría..." value={nuevaCat} onChange={e => setNuevaCat(e.target.value)} style={styles.input} />
            <button type="submit" style={styles.btnAgregar}>+</button>
          </form>

          <ul style={styles.list}>
            {categorias.map(c => (
              <li key={c.idCategoria} style={styles.listItem}>
                {editandoCat === c.idCategoria ? (
                  <div style={styles.editRow}>
                    <input type="text" value={nombreEditCat} onChange={e => setNombreEditCat(e.target.value)} style={styles.inputSmall} />
                    <button onClick={() => handleActualizarCat(c.idCategoria)} style={styles.btnCheck}>✔️</button>
                    <button onClick={() => setEditandoCat(null)} style={styles.btnCross}>❌</button>
                  </div>
                ) : (
                  <>
                    <span>{c.nombreCategoria}</span>
                    <div style={styles.actions}>
                      <button onClick={() => { setEditandoCat(c.idCategoria); setNombreEditCat(c.nombreCategoria); }} style={styles.btnMiniEdit}>✏️</button>
                      <button onClick={() => handleEliminarCat(c.idCategoria)} style={styles.btnMiniDel}>🗑️</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* COLUMNA MARCAS */}
        <div style={styles.colCard}>
          <h3 style={styles.sectionTitle}>🏷️ Marcas de Fabricantes</h3>
          <form onSubmit={handleGuardarMar} style={styles.inlineForm}>
            <input type="text" placeholder="Nueva marca..." value={nuevaMar} onChange={e => setNuevaMar(e.target.value)} style={styles.input} />
            <button type="submit" style={styles.btnAgregar}>+</button>
          </form>

          <ul style={styles.list}>
            {marcas.map(m => (
              <li key={m.idMarca} style={styles.listItem}>
                {editandoMar === m.idMarca ? (
                  <div style={styles.editRow}>
                    <input type="text" value={nombreEditMar} onChange={e => setNombreEditMar(e.target.value)} style={styles.inputSmall} />
                    <button onClick={() => handleActualizarMar(m.idMarca)} style={styles.btnCheck}>✔️</button>
                    <button onClick={() => setEditandoMar(null)} style={styles.btnCross}>❌</button>
                  </div>
                ) : (
                  <>
                    <span>{m.nombreMarca}</span>
                    <div style={styles.actions}>
                      <button onClick={() => { setEditandoMar(m.idMarca); setNombreEditMar(m.nombreMarca); }} style={styles.btnMiniEdit}>✏️</button>
                      <button onClick={() => handleEliminarMar(m.idMarca)} style={styles.btnMiniDel}>🗑️</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { width: '100%', padding: '10px 0' },
  pageTitle: { fontSize: '22px', fontWeight: '700', color: 'var(--color-dark-primary)', marginBottom: '25px' },
  flexGrid: { display: 'flex', gap: '25px', flexWrap: 'wrap' },
  colCard: { flex: 1, minWidth: '320px', backgroundColor: '#ffffff', padding: '25px', borderRadius: '12px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', marginBottom: '15px', color: 'var(--color-dark-secondary)' },
  inlineForm: { display: 'flex', gap: '10px', marginBottom: '20px' },
  input: { flex: 1, padding: '11px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '14px', backgroundColor: '#f8fafc', outline: 'none', boxSizing: 'border-box' },
  inputSmall: { flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '13px' },
  select: { flex: 1, padding: '11px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '14px', backgroundColor: '#f8fafc', outline: 'none' },
  btnAgregar: { backgroundColor: 'var(--color-brand)', color: '#fff', border: 'none', padding: '0 18px', borderRadius: '6px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' },
  btnQuick: { backgroundColor: 'var(--color-dark-secondary)', color: '#fff', border: 'none', padding: '0 14px', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #f1f5f9', fontSize: '14px' },
  editRow: { display: 'flex', gap: '6px', width: '100%' },
  actions: { display: 'flex', gap: '8px' },
  btnMiniEdit: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' },
  btnMiniDel: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' },
  btnCheck: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' },
  btnCross: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' },
  btnGuardar: { backgroundColor: 'var(--color-brand)', color: '#ffffff', padding: '11px 20px', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' },
  btnCancelar: { backgroundColor: '#e2e8f0', color: 'var(--color-dark-secondary)', padding: '11px 20px', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' },
  card: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '12px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)', width: '100%', maxWidth: '650px', margin: 'auto' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 },
  row: { display: 'flex', gap: '15px', width: '100%' },
  label: { fontSize: '13px', fontWeight: '600', color: 'var(--color-dark-secondary)' },
  btnRow: { display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '15px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15,23,42,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modalCard: { backgroundColor: '#ffffff', padding: '25px', borderRadius: '12px', boxShadow: 'var(--shadow-md)', width: '300px', display: 'flex', flexDirection: 'column', gap: '12px' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '5px' },
  errorAlert: { backgroundColor: '#fee2e2', color: 'var(--color-danger)', padding: '10px', borderRadius: '6px', fontSize: '14px', marginBottom: '15px', border: '1px solid #fca5a5', textAlign: 'center', fontWeight: '500' }
};