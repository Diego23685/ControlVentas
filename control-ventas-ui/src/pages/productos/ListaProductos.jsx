import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';

export const ListaProductos = () => {
  const [productos, setProductos] = useState([]);
  const navigate = useNavigate();

  const cargarProductos = async () => {
    try {
      const res = await apiClient.get('/Productos');
      setProductos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const handleEliminar = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este producto del inventario?')) {
      try {
        await apiClient.delete(`/Productos/${id}`);
        cargarProductos(); // Refrescar tabla
      } catch (err) {
        alert('No se puede eliminar el producto porque está amarrado a una factura existente.');
      }
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-dark-primary)', margin: 0 }}>
          📦 CONTROL DE INVENTARIO / REPUESTOS
        </h2>
        <button onClick={() => navigate('/productos/crear')} style={styles.btnGuardar}>
          + Nuevo Repuesto
        </button>
      </div>

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.cellPadding}>ID</th>
              <th style={styles.cellPadding}>Descripción</th>
              <th style={styles.cellPadding}>Precio</th>
              <th style={styles.cellPadding}>Stock</th>
              <th style={{ ...styles.cellPadding, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map(p => (
              <tr key={p.idProducto} style={styles.tdRow}>
                <td style={styles.cellPadding}>#00{p.idProducto}</td>
                <td style={{ ...styles.cellPadding, fontWeight: '500' }}>{p.nombreProducto}</td>
                <td style={styles.cellPadding}>C$ {(p.precio || p.precioVenta || 0).toFixed(2)}</td>
                <td style={{ 
                  ...styles.cellPadding, 
                  fontWeight: 'bold', 
                  color: p.stockActual <= (p.stockMinimo || 0) ? 'var(--color-brand)' : 'var(--color-success)' 
                }}>
                  {p.stockActual} unidades
                </td>
                <td style={{ ...styles.cellPadding, textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={() => navigate(`/productos/editar/${p.idProducto}`)} style={styles.btnEditar}>✏️ Editar</button>
                    <button onClick={() => handleEliminar(p.idProducto)} style={styles.btnBorrar}>🗑️ Quitar</button>
                  </div>
                </td>
              </tr>
            ))}
            {productos.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--color-dark-secondary)' }}>
                  No hay productos registrados en la base de datos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  btnGuardar: { 
    backgroundColor: 'var(--color-brand)', 
    color: '#ffffff', 
    padding: '11px 20px', 
    border: 'none', 
    borderRadius: '6px', 
    fontWeight: '600', 
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)',
    fontSize: '14px'
  },
  tableCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: '12px', 
    boxShadow: 'var(--shadow-md)', 
    border: '1px solid var(--color-border)', 
    overflow: 'hidden' 
  },
  table: { 
    width: '100%', 
    borderCollapse: 'collapse', 
    textAlign: 'left' 
  },
  thRow: { 
    backgroundColor: '#f8fafc', 
    borderBottom: '1px solid var(--color-border)', 
    fontSize: '13px', 
    color: 'var(--color-dark-secondary)',
    fontWeight: '700'
  },
  tdRow: { 
    borderBottom: '1px solid #f1f5f9', 
    fontSize: '14px',
    transition: 'background-color 0.2s'
  },
  cellPadding: {
    padding: '14px 18px'
  },
  btnEditar: { 
    backgroundColor: '#e0f2fe', 
    color: '#0369a1', 
    border: 'none', 
    padding: '6px 12px', 
    borderRadius: '4px', 
    cursor: 'pointer', 
    fontWeight: '600',
    fontSize: '13px'
  },
  btnBorrar: { 
    backgroundColor: '#fee2e2', 
    color: 'var(--color-danger)', 
    border: 'none', 
    padding: '6px 12px', 
    borderRadius: '4px', 
    cursor: 'pointer', 
    fontWeight: '600',
    fontSize: '13px'
  }
};