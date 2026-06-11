import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

export const Facturacion = () => {
  const { user, activeTurno } = useAuth();
  
  // Catálogos cargados de la API
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  
  // Estado del Carrito (El Detalle de la Venta)
  const [carrito, setCarrito] = useState([]);
  
  // Estado de la Cabecera (El Maestro de la Venta)
  const [idCliente, setIdCliente] = useState('');
  const [idMetodoPago, setIdMetodoPago] = useState('');
  const [tipoComprobante, setTipoComprobante] = useState('Factura');
  const [numComprobante, setNumComprobante] = useState('');
  
  // Estados de control
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 1. Cargar datos en paralelo y calcular el número correlativo automático
  const cargarModulo = async () => {
    try {
      const [resProd, resCli, resMet, resVentas] = await Promise.all([
        apiClient.get('/Productos'),
        apiClient.get('/Clientes'),
        apiClient.get('/MetodosPago'),
        apiClient.get('/Ventas') // Jala el historial contable
      ]);

      // Filtrar solo productos con estado activo (true)
      const activos = resProd.data.filter(p => p.estado === true || p.estado === null);
      setProductos(activos);
      setClientes(resCli.data);
      setMetodosPago(resMet.data);
      
      if (resCli.data.length > 0) setIdCliente(resCli.data[0].idCliente);
      if (resMet.data.length > 0) setIdMetodoPago(resMet.data[0].idMetodo);

      // Si la última factura en la BD fue la "4", el sistema genera automáticamente el string "5"
      let siguienteNumero = 1;
      if (resVentas.data && resVentas.data.length > 0) {
        const ids = resVentas.data.map(v => parseInt(v.numFactura || v.numComprobante) || 0);
        const maxId = Math.max(...ids);
        if (maxId > 0) siguienteNumero = maxId + 1;
      }
      setNumComprobante(siguienteNumero.toString());

    } catch (err) {
      setError('Error al sincronizar catálogos y folios correlativos.');
    }
  };

  useEffect(() => {
    cargarModulo();
  }, []);

  // 2. Lógica para agregar un producto al carrito
  const agregarAlCarrito = (producto) => {
    setError('');
    setSuccess('');
    if (producto.stockActual <= 0) {
      setError(`El repuesto "${producto.nombreProducto}" se encuentra agotado en almacén.`);
      return;
    }

    const existe = carrito.find(item => item.idProducto === producto.idProducto);
    if (existe) {
      if (existe.cantidad >= producto.stockActual) {
        setError(`Límite crítico: Solo quedan ${producto.stockActual} unidades disponibles de este repuesto.`);
        return;
      }
      setCarrito(carrito.map(item => 
        item.idProducto === producto.idProducto 
          ? { ...item, cantidad: item.cantidad + 1 } 
          : item
      ));
    } else {
      setCarrito([...carrito, {
        idProducto: producto.idProducto,
        nombreProducto: producto.nombreProducto,
        precioVenta: producto.precioVenta || producto.precio || 0, 
        cantidad: 1,
        descuento: 0,
        stockMaximo: producto.stockActual
      }]);
    }
  };

  // 3. Modificar cantidades o descuentos dinámicamente en el carrito
  const actualizarLinea = (idProducto, propiedad, valor) => {
    setCarrito(carrito.map(item => {
      if (item.idProducto === idProducto) {
        let nuevoValor = parseFloat(valor) || 0;
        if (propiedad === 'cantidad') {
          if (nuevoValor > item.stockMaximo) nuevoValor = item.stockMaximo;
          if (nuevoValor < 1) nuevoValor = 1;
        }
        return { ...item, [propiedad]: nuevoValor };
      }
      return item;
    }));
  };

  const eliminarLinea = (idProducto) => {
    setCarrito(carrito.filter(item => item.idProducto !== idProducto));
  };

  // 4. Cálculos monetarios automáticos en caliente
  const calcularSubtotal = () => carrito.reduce((sum, item) => sum + (item.precioVenta * item.cantidad) - item.descuento, 0);
  const calcularImpuesto = () => calcularSubtotal() * 0.15; // 15% del IVA de Nicaragua
  const calcularTotal = () => calcularSubtotal() + calcularImpuesto();

  // 5. Enviar el JSON Maestro-Detalle al POST de Ventas
  // 5. Enviar el JSON Maestro-Detalle al POST de Ventas usando tu DTO exacto
  const handleProcesarVenta = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setError('');
    setSuccess('');

    if (!activeTurno) {
      setError('Operación denegada: Debe abrir un turno en el módulo Control de Caja.');
      return;
    }
    if (carrito.length === 0) {
      setError('El carrito está vacío. Seleccione repuestos del catálogo.');
      return;
    }

    setSubmitting(true);

    const ventaPayload = {
      IdCliente: parseInt(idCliente),
      IdUsuario: user.idUsuario,
      IdTurno: parseInt(activeTurno),
      IdMetodoPago: parseInt(idMetodoPago),
      TipoComprobante: tipoComprobante, // Envía 'Factura' o 'Recibo'
      NumComprobante: numComprobante,   // Satisface la validación required
      Impuesto: parseFloat(calcularImpuesto()),
      Total: parseFloat(calcularTotal()),
      
      // Mapeo exacto a tu List<DetalleVentaDto> Detalles
      Detalles: carrito.map(item => ({
        IdProducto: item.idProducto,
        Cantidad: parseInt(item.cantidad),
        PrecioVenta: parseFloat(item.precioVenta),
        Descuento: parseFloat(item.descuento || 0)
      }))
    };

    try {
      // Impactamos directamente a tu endpoint POST original
      const response = await apiClient.post('/Ventas', ventaPayload);
      
      setSuccess(`¡Venta #${numComprobante} procesada con éxito! Inventario rebajado, Kardex asentado y Pago registrado.`);
      setCarrito([]);
      await cargarModulo(); // Recarga el catálogo de productos con el stock real actualizado y avanza el correlativo
    } catch (err) {
      if (err.response?.data?.errors) {
        // Si .NET detecta algún error de validación, mapeamos el diccionario de errores de forma legible
        const msg = Object.values(err.response.data.errors).flat().join(' | ');
        setError(msg);
      } else {
        setError(err.response?.data?.mensaje || 'Error crítico de consistencia al procesar la facturación.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrar la lista de productos según el buscador superior del catálogo
  const productosFiltrados = productos.filter(p => 
    p.nombreProducto.toLowerCase().includes(busqueda.toLowerCase()) || 
    p.idProducto.toString() === busqueda
  );

  return (
    <div style={styles.container}>
      {error && <div style={styles.errorAlert}>{error}</div>}
      {success && <div style={styles.successAlert}>{success}</div>}

      <div style={styles.layoutGrid}>
        
        {/* COLUMNA IZQUIERDA: CATÁLOGO VISUAL DE PRODUCTOS DISPONIBLES */}
        <div style={styles.colCatalog}>
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>📦 Repuestos Disponibles</h3>
            <input 
              type="text" 
              placeholder="🔍 Filtrar repuestos en caliente..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={styles.inputBusqueda}
            />
            
            <div style={styles.gridProductos}>
              {productosFiltrados.map(p => (
                <div 
                  key={p.idProducto} 
                  onClick={() => agregarAlCarrito(p)} 
                  style={p.stockActual > 0 ? styles.productItem : styles.productItemAgotado}
                >
                  <div style={styles.prodHeader}>
                    <span style={styles.prodId}>#00{p.idProducto}</span>
                    <span style={p.stockActual > 5 ? styles.stockBadge : styles.stockBadgeCritico}>
                      {p.stockActual} u.
                    </span>
                  </div>
                  <h4 style={styles.prodName}>{p.nombreProducto}</h4>
                  <div style={styles.prodPrice}>C$ {(p.precioVenta || 0).toFixed(2)}</div>
                </div>
              ))}
              {productosFiltrados.length === 0 && (
                <div style={styles.noData}>No hay repuestos que coincidan con la búsqueda.</div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMNA CENTRAL: EL CARRITO DE LA COMPRA ACTUAL */}
        <div style={styles.colCart}>
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>🛒 Detalle de la Venta</h3>
            
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th>Artículo</th>
                  <th style={{width: '70px', textAlign: 'center'}}>Cant.</th>
                  <th>Precio</th>
                  <th style={{width: '80px', textAlign: 'center'}}>Desc.</th>
                  <th style={{textAlign: 'right'}}>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {carrito.map(item => (
                  <tr key={item.idProducto} style={styles.tdRow}>
                    <td style={{fontWeight: '500'}}>{item.nombreProducto}</td>
                    <td>
                      <input 
                        type="number" 
                        value={item.cantidad} 
                        onChange={(e) => actualizarLinea(item.idProducto, 'cantidad', e.target.value)}
                        style={styles.tableInput}
                      />
                    </td>
                    <td>C$ {item.precioVenta.toFixed(2)}</td>
                    <td>
                      <input 
                        type="number" 
                        value={item.descuento} 
                        onChange={(e) => actualizarLinea(item.idProducto, 'descuento', e.target.value)}
                        style={styles.tableInput}
                      />
                    </td>
                    <td style={{fontWeight: '600', textAlign: 'right'}}>
                      C$ {((item.precioVenta * item.cantidad) - item.descuento).toFixed(2)}
                    </td>
                    <td style={{textAlign: 'center'}}>
                      <button onClick={() => eliminarLinea(item.idProducto)} style={styles.btnEliminar}>❌</button>
                    </td>
                  </tr>
                ))}
                {carrito.length === 0 && (
                  <tr>
                    <td colSpan="6" style={styles.emptyCartText}>
                      Selecciona artículos del catálogo izquierdo para armar la factura.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* COLUMNA DERECHA: CONFIGURACIÓN MAESTRO Y TOTALES MACRO */}
        <div style={styles.colMaster}>
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>📄 Cabecera Contable</h3>
            
            <form onSubmit={handleProcesarVenta} style={styles.formMaster}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Cliente Receptor</label>
                <select value={idCliente} onChange={(e) => setIdCliente(e.target.value)} style={styles.input}>
                  {clientes.map(c => <option key={c.idCliente} value={c.idCliente}>{c.nombres} {c.apellidos}</option>)}
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Método de Liquidación</label>
                <select value={idMetodoPago} onChange={(e) => setIdMetodoPago(e.target.value)} style={styles.input}>
                  {metodosPago.map(m => <option key={m.idMetodo} value={m.idMetodo}>{m.nombreMetodo}</option>)}
                </select>
              </div>

              <div style={styles.rowInputs}>
                <div style={styles.inputGroup} { ...{style: {flex: 1}} }>
                  <label style={styles.label}>Tipo Doc.</label>
                  <select value={tipoComprobante} onChange={(e) => setTipoComprobante(e.target.value)} style={styles.input}>
                    <option value="Factura">Factura</option>
                    <option value="Recibo">Recibo</option>
                  </select>
                </div>
                <div style={styles.inputGroup} { ...{style: {flex: 1}} }>
                  <label style={styles.label}>N° Correlativo</label>
                  <input type="text" value={numComprobante} readOnly style={styles.inputDisabled}/>
                </div>
              </div>

              <hr style={{borderColor: 'var(--color-border)', margin: '15px 0', borderStyle: 'solid', borderWidth: '0.5px'}}/>

              {/* PANEL DE TOTALES */}
              <div style={styles.totalesBox}>
                <div style={styles.totalRow}><span>Subtotal:</span><span>C$ {calcularSubtotal().toFixed(2)}</span></div>
                <div style={styles.totalRow}><span>IVA (15%):</span><span>C$ {calcularImpuesto().toFixed(2)}</span></div>
                <div style={styles.totalRowGrand}>
                  <span style={{color: 'white'}}>TOTAL:</span>
                  <span style={{color: 'white'}}>C$ {calcularTotal().toFixed(2)}</span>
                </div>
              </div>

              <button type="submit" disabled={submitting} style={styles.btnFacturar}>
                {submitting ? 'Procesando...' : 'Emitir Comprobante ⚡'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

const styles = {
  container: { padding: '10px 0', width: '100%' },
  layoutGrid: { display: 'flex', gap: '20px', flexWrap: 'wrap', width: '100%' },
  colCatalog: { flex: '1.2', minWidth: '340px' },
  colCart: { flex: '1.5', minWidth: '400px' },
  colMaster: { flex: '1', minWidth: '300px' },
  card: { backgroundColor: '#ffffff', padding: '22px', borderRadius: '12px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)' },
  sectionTitle: { fontSize: '15px', fontWeight: '700', marginBottom: '15px', color: 'var(--color-dark-primary)', letterSpacing: '0.5px', textTransform: 'uppercase' },
  inputBusqueda: { width: '100%', padding: '11px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc', marginBottom: '15px', boxSizing: 'border-box' },
  gridProductos: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' },
  productItem: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '6px' },
  productItemAgotado: { backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', opacity: 0.6, cursor: 'not-allowed', display: 'flex', flexDirection: 'column', gap: '6px' },
  prodHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  prodId: { fontSize: '11px', color: '#94a3b8', fontWeight: '600' },
  stockBadge: { backgroundColor: '#dcfce7', color: '#16a34a', fontSize: '11px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' },
  stockBadgeCritico: { backgroundColor: '#fee2e2', color: '#ef4444', fontSize: '11px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' },
  prodName: { fontSize: '13px', fontWeight: '600', margin: 0, color: 'var(--color-dark-primary)', minHeight: '34px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  prodPrice: { fontSize: '14px', fontWeight: '700', color: 'var(--color-brand)' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  thRow: { borderBottom: '2px solid var(--color-border)', paddingBottom: '8px', fontSize: '13px', color: 'var(--color-dark-secondary)' },
  tdRow: { borderBottom: '1px solid #f1f5f9', fontSize: '13px' },
  tableInput: { width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '13px', textAlign: 'center', boxSizing: 'border-box' },
  btnEliminar: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' },
  formMaster: { display: 'flex', flexDirection: 'column', gap: '12px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  rowInputs: { display: 'flex', gap: '12px' },
  label: { fontSize: '12px', fontWeight: '600', color: 'var(--color-dark-secondary)' },
  input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '14px', backgroundColor: '#f8fafc', outline: 'none', boxSizing: 'border-box' },
  inputDisabled: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#e2e8f0', color: '#475569', fontWeight: '600', outline: 'none', boxSizing: 'border-box', cursor: 'not-allowed' },
  totalesBox: { backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' },
  totalRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '500' },
  totalRowGrand: { display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '700', backgroundColor: 'var(--color-dark-primary)', padding: '10px', borderRadius: '6px', marginTop: '4px' },
  btnFacturar: { width: '100%', backgroundColor: 'var(--color-brand)', color: '#fff', padding: '12px', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '5px' },
  errorAlert: { backgroundColor: '#fee2e2', color: 'var(--color-danger)', padding: '10px', borderRadius: '6px', fontSize: '13px', textAlign: 'center', marginBottom: '15px', border: '1px solid #fca5a5', fontWeight: '500' },
  successAlert: { backgroundColor: '#dcfce7', color: 'var(--color-success)', padding: '10px', borderRadius: '6px', fontSize: '13px', textAlign: 'center', marginBottom: '15px', border: '1px solid #86efac', fontWeight: '500' },
  emptyCartText: { textAlign: 'center', padding: '30px 10px', color: '#64748b', fontSize: '13px', fontStyle: 'italic' },
  noData: { textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px', width: '100%' }
};

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = `.table th, .table td { padding: 12px 6px !important; }`;
  document.head.appendChild(styleSheet);
}