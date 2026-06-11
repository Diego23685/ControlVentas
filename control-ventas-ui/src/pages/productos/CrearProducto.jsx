import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';

export const CrearProducto = () => {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Control de Mini-Modales Express
  const [showCatModal, setShowCatModal] = useState(false);
  const [showMarModal, setShowMarModal] = useState(false);
  const [quickCatName, setQuickCatName] = useState('');
  const [quickMarName, setQuickMarName] = useState('');

  const [formData, setFormData] = useState({
    nombreProducto: '',
    idCategoria: '',
    idMarca: '',
    precio: '',
    stockActual: '',
    stockMinimo: '',
    estado: 1
  });

  const cargarCatalogos = async () => {
    try {
      const [resCat, resMar] = await Promise.all([
        apiClient.get('/Categorias'),
        apiClient.get('/Marcas')
      ]);
      setCategorias(resCat.data);
      setMarcas(resMar.data);
      
      setFormData(prev => ({
        ...prev,
        idCategoria: prev.idCategoria || (resCat.data[0]?.idCategoria || ''),
        idMarca: prev.idMarca || (resMar.data[0]?.idMarca || '')
      }));
    } catch (err) {
      setError('Error al sincronizar catálogos secundarios.');
    }
  };

  useEffect(() => {
    cargarCatalogos();
  }, []);

  const handleQuickCat = async () => {
    if (!quickCatName.trim()) return;
    try {
      setError('');
      const res = await apiClient.post('/Categorias', { 
        NombreCategoria: quickCatName, 
        estado: true             
      });
      await cargarCatalogos();
      setFormData(prev => ({ ...prev, idCategoria: res.data.idCategoria || res.data }));
      setQuickCatName('');
      setShowCatModal(false);
    } catch (err) { 
      if (err.response?.data?.mensaje) {
        setError(err.response.data.mensaje);
      } else {
        setError('La categoría ya existe o el formato del DTO es inválido.');
      }
    }
  };

  const handleQuickMar = async () => {
    if (!quickMarName.trim()) return;
    try {
      setError('');
      const res = await apiClient.post('/Marcas', { 
        NombreMarca: quickMarName,   
        estado: true           
      });
      await cargarCatalogos();
      setFormData(prev => ({ ...prev, idMarca: res.data.idMarca || res.data }));
      setQuickMarName('');
      setShowMarModal(false);
    } catch (err) { 
      if (err.response?.data?.mensaje) {
        setError(err.response.data.mensaje);
      } else {
        setError('La marca ya existe o el formato del DTO es inválido.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const idCatParsed = parseInt(formData.idCategoria);
    const idMarParsed = parseInt(formData.idMarca);

    if (!formData.nombreProducto || !formData.precio || !formData.stockActual || isNaN(idCatParsed) || isNaN(idMarParsed)) {
      setError('Por favor, rellene todos los campos obligatorios y verifique la Categoría y Marca.');
      setSubmitting(false);
      return;
    }

    try {
      const codigoUnicoExpress = `TEMP-${Math.floor(Date.now() / 1000)}`;

      const payload = {
        NombreProducto: formData.nombreProducto, 
        StockActual: parseInt(formData.stockActual),
        StockMinimo: parseInt(formData.stockMinimo || 0),
        CodigoBarras: codigoUnicoExpress, 
        IdCategoria: idCatParsed,
        IdMarca: idMarParsed,
        Estado: formData.estado === 1 ? true : false,

        // Mapeo corregido según las columnas decimales de tu base de datos
        PrecioVenta: parseFloat(formData.precio), 
        PrecioCompra: parseFloat(formData.precio), 

        // Objetos vacíos para evadir la validación [Required] de las propiedades de navegación
        IdCategoriaNavigation: {},
        IdMarcaNavigation: {}
      };

      await apiClient.post('/Productos', payload);
      navigate('/productos'); 
    } catch (err) {
      if (err.response?.data?.errors) {
        const msg = Object.values(err.response.data.errors).flat().join(' | ');
        setError(msg);
      } else {
        setError(err.response?.data?.mensaje || 'Error crítico de persistencia en la base de datos.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h3 style={styles.title}>📦 REGISTRAR NUEVO REPUESTO</h3>
        {error && <div style={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nombre del Producto *</label>
            <input type="text" placeholder="Ej: Bujes de carro feo" value={formData.nombreProducto} onChange={e => setFormData({...formData, nombreProducto: e.target.value})} style={styles.input} />
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Categoría *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select value={formData.idCategoria} onChange={e => setFormData({...formData, idCategoria: e.target.value})} style={styles.select}>
                  {categorias.map(c => <option key={c.idCategoria} value={c.idCategoria}>{c.nombreCategoria}</option>)}
                </select>
                <button type="button" onClick={() => setShowCatModal(true)} style={styles.btnQuick}>+</button>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Marca *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select value={formData.idMarca} onChange={e => setFormData({...formData, idMarca: e.target.value})} style={styles.select}>
                  {marcas.map(m => <option key={m.idMarca} value={m.idMarca}>{m.nombreMarca}</option>)}
                </select>
                <button type="button" onClick={() => setShowMarModal(true)} style={styles.btnQuick}>+</button>
              </div>
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Precio de Venta (C$) *</label>
              <input type="number" step="0.01" value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Stock Inicial *</label>
              <input type="number" value={formData.stockActual} onChange={e => setFormData({...formData, stockActual: e.target.value})} style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Stock Mínimo</label>
              <input type="number" value={formData.stockMinimo} onChange={e => setFormData({...formData, stockMinimo: e.target.value})} style={styles.input} />
            </div>
          </div>

          <div style={styles.btnRow}>
            <button type="button" onClick={() => navigate('/productos')} style={styles.btnCancelar}>Cancelar</button>
            <button type="submit" disabled={submitting} style={styles.btnGuardar}>{submitting ? 'Guardando...' : 'Guardar Producto'}</button>
          </div>
        </form>
      </div>

      {/* MINI MODAL CATEGORÍA */}
      {showCatModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h4>📁 Agregar Categoría Express</h4>
            <input type="text" placeholder="Nombre..." value={quickCatName} onChange={e => setQuickCatName(e.target.value)} style={styles.input} />
            <div style={styles.modalActions}>
              <button onClick={() => { setShowCatModal(false); setError(''); }} style={styles.btnCancelar}>Cerrar</button>
              <button onClick={handleQuickCat} style={styles.btnGuardar}>Agregar</button>
            </div>
          </div>
        </div>
      )}

      {/* MINI MODAL MARCA */}
      {showMarModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h4>🏷️ Agregar Marca Express</h4>
            <input type="text" placeholder="Nombre..." value={quickMarName} onChange={e => setQuickMarName(e.target.value)} style={styles.input} />
            <div style={styles.modalActions}>
              <button onClick={() => { setShowMarModal(false); setError(''); }} style={styles.btnCancelar}>Cerrar</button>
              <button onClick={handleQuickMar} style={styles.btnGuardar}>Agregar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { width: '100%', padding: '10px 0' },
  input: { width: '100%', padding: '11px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '14px', backgroundColor: '#f8fafc', outline: 'none', boxSizing: 'border-box' },
  select: { flex: 1, padding: '11px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '14px', backgroundColor: '#f8fafc', outline: 'none' },
  btnQuick: { backgroundColor: 'var(--color-dark-secondary)', color: '#fff', border: 'none', padding: '0 14px', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
  btnGuardar: { backgroundColor: 'var(--color-brand)', color: '#ffffff', padding: '11px 20px', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' },
  btnCancelar: { backgroundColor: '#e2e8f0', color: 'var(--color-dark-secondary)', padding: '11px 20px', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' },
  card: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '12px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)', width: '100%', maxWidth: '650px', margin: 'auto' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  title: { fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: 'var(--color-dark-primary)', letterSpacing: '0.5px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 },
  row: { display: 'flex', gap: '15px', width: '100%' },
  label: { fontSize: '13px', fontWeight: '600', color: 'var(--color-dark-secondary)' },
  btnRow: { display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '15px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15,23,42,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modalCard: { backgroundColor: '#ffffff', padding: '25px', borderRadius: '12px', boxShadow: 'var(--shadow-md)', width: '300px', display: 'flex', flexDirection: 'column', gap: '12px' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '5px' },
  errorAlert: { backgroundColor: '#fee2e2', color: 'var(--color-danger)', padding: '10px', borderRadius: '6px', fontSize: '14px', marginBottom: '15px', border: '1px solid #fca5a5', textAlign: 'center', fontWeight: '500' }
};