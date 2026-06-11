import { useState, useEffect } from 'react';
import apiClient from '../api/client';

export const Reportes = () => {
  const [clientes, setClientes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [datosReporte, setDatosReporte] = useState([]);
  
  // Estados para los filtros seleccionados
  const [idClienteSel, setIdClienteSel] = useState('');
  const [idCategoriaSel, setIdCategoriaSel] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cargar catálogos iniciales para los filtros desplegables
  useEffect(() => {
    const cargarFiltros = async () => {
      try {
        const [resCli, resCat] = await Promise.all([
          apiClient.get('/Clientes'),
          apiClient.get('/Categorias')
        ]);
        setClientes(resCli.data);
        setCategorias(resCat.data);
      } catch (err) {
        setError('Error al sincronizar los filtros de clientes o categorías.');
      }
    };
    cargarFiltros();
  }, []);

  // Consultar el endpoint filtrado según la selección del usuario
  const ejecutarConsulta = async () => {
    setLoading(true);
    setError('');
    try {
      // Construimos las queries de forma dinámica según lo que se haya elegido
      const queryParams = [];
      if (idClienteSel) queryParams.push(`idCliente=${idClienteSel}`);
      if (idCategoriaSel) queryParams.push(`idCategoria=${idCategoriaSel}`);
      
      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      
      const response = await apiClient.get(`/Reportes/filtrado${queryString}`);
      setDatosReporte(response.data.datos || []);
    } catch (err) {
      setError('No se pudo compilar el reporte dinámico con los parámetros seleccionados.');
    } finally {
      setLoading(false);
    }
  };

  // Disparar la consulta automática la primera vez o cuando cambien los filtros
  useEffect(() => {
    ejecutarConsulta();
  }, [idClienteSel, idCategoriaSel]);

  // Cálculo rápido del volumen total de repuestos despachados en el filtro
  const totalUnidadesVendidas = datosReporte.reduce((sum, item) => sum + item.cantidad, 0);

  // Función nativa para mandar a imprimir la sección limpia de la tabla
  const handleImprimir = () => {
    window.print();
  };

  return (
    <div style={styles.container} className="seccion-reporte">
      <div style={styles.filterCard} className="no-print">
        <h3 style={styles.sectionTitle}>🎯 FILTROS DE PERSONALIZACIÓN</h3>
        <div style={styles.rowFilters}>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Filtrar por Cliente</label>
            <select value={idClienteSel} onChange={e => setIdClienteSel(e.target.value)} style={styles.select}>
              <option value="">-- Todos los Clientes --</option>
              {clientes.map(c => <option key={c.idCliente} value={c.idCliente}>{c.nombres} {c.apellidos}</option>)}
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Filtrar por Categoría</label>
            <select value={idCategoriaSel} onChange={e => setIdCategoriaSel(e.target.value)} style={styles.select}>
              <option value="">-- Todas las Categorías --</option>
              {categorias.map(c => <option key={c.idCategoria} value={c.idCategoria}>{c.nombreCategoria}</option>)}
            </select>
          </div>

          <div style={{...styles.inputGroup, justifyContent: 'flex-end'}}>
            <button onClick={handleImprimir} style={styles.btnPrint}>🖨️ Imprimir Reporte</button>
          </div>

        </div>
      </div>

      {error && <div style={styles.errorAlert}>{error}</div>}

      {/* RESULTADO COMPILADO DEL REPORTE */}
      <div style={styles.tableCard}>
        <div style={styles.reportHeader}>
          <div>
            <h3 style={{margin: '0 0 5px 0', fontSize: '16px', color: 'var(--color-dark-primary)'}}>
              📄 REPORTE DE MOVIMIENTO DE MERCANCÍA
            </h3>
            <p style={{margin: 0, fontSize: '13px', color: '#64748b'}}>
              Mapeo de transacciones asentadas en el libro diario de control_ventas_db
            </p>
          </div>
          <div style={styles.summaryBadge}>
            Volumen Total: <strong>{totalUnidadesVendidas} u.</strong>
          </div>
        </div>

        {loading ? (
          <div style={styles.loadingText}>Masticando datos contables desde MySQL...</div>
        ) : (
          <table style={styles.table} className="table">
            <thead>
              <tr style={styles.thRow}>
                <th>ID Producto</th>
                <th>Descripción del Repuesto</th>
                <th>Categoría</th>
                <th style={{textAlign: 'right'}}>Cantidad Vendida</th>
              </tr>
            </thead>
            <tbody>
              {datosReporte.map((item, index) => (
                <tr key={index} style={styles.tdRow}>
                  <td style={{color: '#94a3b8', fontWeight: '600'}}>#00{item.idProducto}</td>
                  <td style={{fontWeight: '500', color: 'var(--color-dark-primary)'}}>{item.nombreProducto}</td>
                  <td><span style={styles.catBadge}>{item.categoria}</span></td>
                  <td style={{textAlign: 'right', fontWeight: '700', color: 'var(--color-brand)'}}>
                    {item.cantidad} unidades
                  </td>
                </tr>
              ))}
              {datosReporte.length === 0 && (
                <tr>
                  <td colSpan="4" style={{textAlign: 'center', padding: '30px', color: '#64748b', fontStyle: 'italic'}}>
                    No se registran transacciones de productos para los filtros aplicados actualmente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { width: '100%' },
  sectionTitle: { fontSize: '13px', fontWeight: '700', marginBottom: '15px', color: 'var(--color-dark-secondary)', letterSpacing: '0.5px' },
  filterCard: { backgroundColor: '#ffffff', padding: '20px 25px', borderRadius: '12px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)', marginBottom: '25px' },
  rowFilters: { display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px', flex: '1', minWidth: '220px' },
  label: { fontSize: '12px', fontWeight: '600', color: '#64748b' },
  select: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '14px', backgroundColor: '#f8fafc', outline: 'none' },
  btnPrint: { backgroundColor: 'var(--color-dark-primary)', color: '#ffffff', border: 'none', padding: '11px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', height: '40px', transition: 'background 0.2s' },
  tableCard: { backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)', overflow: 'hidden' },
  reportHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 25px', borderBottom: '1px solid var(--color-border)', backgroundColor: '#ffffff', flexWrap: 'wrap', gap: '15px' },
  summaryBadge: { backgroundColor: '#f1f5f9', color: 'var(--color-dark-primary)', padding: '8px 14px', borderRadius: '6px', fontSize: '13px', border: '1px solid var(--color-border)' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-border)', fontSize: '13px', color: 'var(--color-dark-secondary)' },
  tdRow: { borderBottom: '1px solid #f1f5f9', fontSize: '14px' },
  catBadge: { backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' },
  errorAlert: { backgroundColor: '#fee2e2', color: 'var(--color-danger)', padding: '12px', borderRadius: '6px', fontSize: '14px', marginBottom: '20px', border: '1px solid #fca5a5', textAlign: 'center' },
  loadingText: { textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '14px' }
};

// Inyectamos reglas CSS globales nativas de impresión de media query
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = `
    .table th, .table td { padding: 14px 20px !important; }
    @media print {
      body { backgroundColor: #ffffff !important; color: #000000 !important; }
      .no-print, aside, header, .topHeader { display: none !important; }
      main { width: 100% !important; margin: 0 !important; padding: 0 !important; height: auto !important; overflow: visible !important; }
      .seccion-reporte { padding: 0 !important; }
      .tableCard { box-shadow: none !important; border: none !important; }
    }
  `;
  document.head.appendChild(styleSheet);
}