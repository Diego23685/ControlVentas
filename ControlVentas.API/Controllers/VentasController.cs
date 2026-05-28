using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ControlVentas.API.Models;
using ControlVentas.API.Dtos;
using System;
using System.Threading.Tasks;
using System.Linq;

namespace ControlVentas.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VentasController : ControllerBase
    {
        private readonly VentasDbContext _context;

        public VentasController(VentasDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var ventas = await _context.Ventas.OrderByDescending(v => v.IdVenta).ToListAsync();
            return Ok(ventas);
        }

        // POST: api/Ventas
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] VentaCreateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (dto.Detalles == null || dto.Detalles.Count == 0)
            {
                return BadRequest(new { mensaje = "La venta debe incluir al menos un producto." });
            }

            // ⚡ CORREGIDO: Comparamos contra true para verificar que el turno esté abierto
            var turnoValido = await _context.Set<TurnosCaja>().AnyAsync(t => t.IdTurno == dto.IdTurno && t.Estado == true);
            if (!turnoValido) return BadRequest(new { mensaje = "No se puede facturar porque este turno de caja está cerrado o no existe." });

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var nuevaVenta = new Venta
                {
                    IdCliente = dto.IdCliente,
                    IdUsuario = dto.IdUsuario,     
                    IdTurno = dto.IdTurno,         
                    NumFactura = dto.NumComprobante,
                    FechaVenta = DateTime.Now,
                    Subtotal = dto.Total - dto.Impuesto,
                    Impuesto = dto.Impuesto,
                    Descuento = dto.Detalles.Sum(d => d.Descuento),
                    Total = dto.Total,
                    Estado = "PAGADA"
                };

                _context.Ventas.Add(nuevaVenta);
                await _context.SaveChangesAsync(); 

                foreach (var item in dto.Detalles)
                {
                    var producto = await _context.Productos.FindAsync(item.IdProducto);
                    if (producto == null) return NotFound(new { mensaje = $"El producto con ID {item.IdProducto} no existe." });

                    if (producto.StockActual < item.Cantidad)
                    {
                        return BadRequest(new { mensaje = $"Stock insuficiente para '{producto.NombreProducto}'. Disponible: {producto.StockActual}" });
                    }

                    producto.StockActual -= item.Cantidad;

                    var detalle = new DetalleVenta
                    {
                        IdVenta = nuevaVenta.IdVenta,
                        IdProducto = item.IdProducto,
                        Cantidad = item.Cantidad,
                        PrecioUnitario = item.PrecioVenta,
                        DescuentoAplicado = item.Descuento
                    };

                    _context.DetalleVentas.Add(detalle);

                    var kardex = new KardexInventario
                    {
                        IdProducto = item.IdProducto,
                        TipoMovimiento = "SALIDA",
                        Origen = "VENTA",
                        IdReferencia = nuevaVenta.IdVenta,
                        Cantidad = item.Cantidad,
                        StockAnterior = producto.StockActual + item.Cantidad,
                        StockPosterior = producto.StockActual,
                        FechaMovimiento = DateTime.Now
                    };
                    _context.Set<KardexInventario>().Add(kardex);
                }

                var pagoVenta = new PagosVentum
                {
                    IdVenta = nuevaVenta.IdVenta,
                    IdMetodo = dto.IdMetodoPago,
                    MontoPagado = dto.Total // Ajustado según tu mapeo físico anterior
                };
                
                try
                {
                    // Intentamos mapear de forma segura la propiedad de monto
                    var propMonto = pagoVenta.GetType().GetProperties().FirstOrDefault(p => p.Name.ToLower().Contains("monto"));
                    if (propMonto != null) propMonto.SetValue(pagoVenta, dto.Total);
                }
                catch {}

                _context.PagosVenta.Add(pagoVenta);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { mensaje = "¡Factura procesada y Kardex actualizado con éxito!", idVenta = nuevaVenta.IdVenta });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { mensaje = "Error crítico al procesar la transacción", error = ex.Message });
            }
        }

        [HttpGet("reporte-factura/{id}")]
        public async Task<IActionResult> GetReporteFactura(int id)
        {
            var ventaReporte = await _context.Ventas
                .Where(v => v.IdVenta == id)
                .Select(v => new
                {
                    v.IdVenta,
                    v.NumFactura,
                    v.Total,
                    v.Impuesto,
                    v.FechaVenta,
                    Cliente = _context.Clientes.Where(c => c.IdCliente == v.IdCliente).Select(c => new { c.Nombres, c.Apellidos, c.NumDocumento }).FirstOrDefault(),
                    Productos = _context.DetalleVentas.Where(d => d.IdVenta == v.IdVenta).Select(d => new { d.IdProducto, d.Cantidad, d.PrecioUnitario, NombreProducto = _context.Productos.Where(p => p.IdProducto == d.IdProducto).Select(p => p.NombreProducto).FirstOrDefault() }).ToList()
                }).FirstOrDefaultAsync();

            if (ventaReporte == null) return NotFound(new { mensaje = "Factura no encontrada." });
            return Ok(ventaReporte);
        }

        [HttpGet("reporte-maestro")]
        public async Task<IActionResult> GetReporteMasterDetalle([FromQuery] string periodo = "recientes")
        {
            var query = _context.Ventas.AsQueryable();
            if (periodo.ToLower() == "recientes") query = query.OrderByDescending(v => v.IdVenta).Take(20);

            var ventasConsolidadas = await query
                .Select(v => new
                {
                    v.IdVenta,
                    v.NumFactura,
                    v.Total,
                    v.FechaVenta,
                    Cliente = _context.Clientes.Where(c => c.IdCliente == v.IdCliente).Select(c => $"{c.Nombres} {c.Apellidos}").FirstOrDefault(),
                    Cajero = _context.Set<Usuario>().Where(u => u.IdUsuario == v.IdUsuario).Select(u => u.Username).FirstOrDefault()
                }).ToListAsync();

            return Ok(new { FiltroPeriodo = periodo, TotalGeneralVendido = ventasConsolidadas.Sum(v => v.Total), CantidadVentas = ventasConsolidadas.Count, Documentos = ventasConsolidadas });
        }
    }
}