import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../api/client';

export const EditarProducto = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    idProducto: id,
    nombreProducto: '',
    idCategoria: '',
    idMarca: '',
    precio: '',
    stockActual: '',
    stockMinimo: '',
    codigoBarras: '',
    estado: true
  });

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resCat, resMar, resProd] = await Promise.all([
          apiClient.get('/Categorias'),
          apiClient.get('/Marcas'),
          apiClient.get(`/Productos`) 
        ]);
        
        setCategorias(resCat.data);
        setMarcas(resMar.data);

        // Buscar el producto específico dentro del inventario
        const p = resProd.data.find(prod => prod.idProducto.toString() === id);
        if (p) {
          setFormData({
            idProducto: p.idProducto,
            nombreProducto: p.nombreProducto,
            idCategoria: p.idCategoria,
            idMarca: p.idMarca,
            precio: p.precioVenta !== undefined ? p.precioVenta : p.precio, 
            stockActual: p.stockActual,
            stockMinimo: p.stockMinimo,
            codigoBarras: p.codigoBarras,
            estado: p.estado
          });
        } else {
          setError('No se encontró el repuesto solicitado en el inventario.');
        }
      } catch (err) {
        setError('Error al sincronizar datos con el servidor.');
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const idCatParsed = parseInt(formData.idCategoria);
    const idMarParsed = parseInt(formData.idMarca);

    if (!formData.nombreProducto || !formData.precio || !formData.stockActual || isNaN(idCatParsed) || isNaN(idMarParsed)) {
      setError('Por favor, rellene todos los campos obligatorios antes de actualizar.');
      return;
    }

    try {
      const payload = {
        IdProducto: parseInt(id),
        NombreProducto: formData.nombreProducto,
        StockActual: parseInt(formData.stockActual),
        StockMinimo: parseInt(formData.stockMinimo || 0),
        CodigoBarras: formData.codigoBarras || `TEMP-${Math.floor(Date.now() / 1000)}`,
        IdCategoria: idCatParsed,
        IdMarca: idMarParsed,
        Estado: formData.estado === 1 || formData.estado === true ? true : false,

        // Mapeo exacto a las columnas decimales de tu base de datos
        PrecioVenta: parseFloat(formData.precio),
        PrecioCompra: parseFloat(formData.precio),

        // Satisface las restricciones de navegación requeridas [Required] en .NET
        IdCategoriaNavigation: {},
        IdMarcaNavigation: {}
      };

      await apiClient.put(`/Productos/${id}`, payload);
      navigate('/productos'); // Redirección al listado general tras el éxito
    } catch (err) {
      if (err.response?.data?.errors) {
        const msg = Object.values(err.response.data.errors).flat().join(' | ');
        setError(msg);
      } else {
        setError(err.response?.data?.mensaje || 'No se pudieron aplicar las modificaciones en la base de datos.');
      }
    }
  };

  if (loading) return <div style={styles.centered}>Cargando datos del repuesto...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h3 style={styles.title}>✏️ MODIFICAR REPUESTO # {id}</h3>
        {error && <div style={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nombre del Producto *</label>
            <input type="text" value={formData.nombreProducto} onChange={e => setFormData({...formData, nombreProducto: e.target.value})} style={styles.input} />
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Categoría *</label>
              <select value={formData.idCategoria} onChange={e => setFormData({...formData, idCategoria: e.target.value})} style={styles.select}>
                {categorias.map(c => <option key={c.idCategoria} value={c.idCategoria}>{c.nombreCategoria}</option>)}
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Marca *</label>
              <select value={formData.idMarca} onChange={e => setFormData({...formData, idMarca: e.target.value})} style={styles.select}>
                {marcas.map(m => <option key={m.idMarca} value={m.idMarca}>{m.nombreMarca}</option>)}
              </select>
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Precio de Venta (C$) *</label>
              <input type="number" step="0.01" value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Existencia en Almacén *</label>
              <input type="number" value={formData.stockActual} onChange={e => setFormData({...formData, stockActual: e.target.value})} style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Stock Mínimo</label>
              <input type="number" value={formData.stockMinimo} onChange={e => setFormData({...formData, stockMinimo: e.target.value})} style={styles.input} />
            </div>
          </div>

          <div style={styles.btnRow}>
            <button type="button" onClick={() => navigate('/productos')} style={styles.btnCancelar}>Regresar</button>
            <button type="submit" style={styles.btnGuardar}>Actualizar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: { width: '100%', padding: '10px 0' },
  card: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '12px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)', width: '100%', maxWidth: '650px', margin: 'auto' },
  title: { fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: 'var(--color-dark-primary)', letterSpacing: '0.5px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 },
  row: { display: 'flex', gap: '15px', width: '100%' },
  label: { fontSize: '13px', fontWeight: '600', color: 'var(--color-dark-secondary)' },
  input: { width: '100%', padding: '11px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '14px', backgroundColor: '#f8fafc', outline: 'none', boxSizing: 'border-box' },
  select: { flex: 1, padding: '11px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '14px', backgroundColor: '#f8fafc', outline: 'none' },
  btnRow: { display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '15px' },
  btnCancelar: { backgroundColor: '#e2e8f0', color: 'var(--color-dark-secondary)', padding: '11px 20px', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' },
  btnGuardar: { backgroundColor: 'var(--color-brand)', color: '#ffffff', padding: '11px 20px', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' },
  errorAlert: { backgroundColor: '#fee2e2', color: 'var(--color-danger)', padding: '10px', borderRadius: '6px', fontSize: '14px', marginBottom: '15px', border: '1px solid #fca5a5', textAlign: 'center', fontWeight: '500' },
  centered: { textAlign: 'center', padding: '100px', fontSize: '16px', color: '#64748b' }
};