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

        // GET: api/Ventas
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var ventas = await _context.Ventas
                .OrderByDescending(v => v.IdVenta)
                .ToListAsync();
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

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // 1. Crear la cabecera de la Venta con tu DTO real
                var nuevaVenta = new Venta
                {
                    IdCliente = dto.IdCliente,
                    Total = dto.Total,
                    Impuesto = dto.Impuesto
                };

                _context.Ventas.Add(nuevaVenta);
                await _context.SaveChangesAsync(); 

                // 2. Procesar cada producto del detalle y restar existencias del Kardex
                foreach (var item in dto.Detalles)
                {
                    var producto = await _context.Productos.FindAsync(item.IdProducto);
                    
                    if (producto == null)
                    {
                        return NotFound(new { mensaje = $"El producto con ID {item.IdProducto} no existe." });
                    }

                    if (producto.StockActual < item.Cantidad)
                    {
                        return BadRequest(new { mensaje = $"Stock insuficiente para '{producto.NombreProducto}'. Disponible: {producto.StockActual}" });
                    }

                    // Reducimos las existencias físicas reales
                    producto.StockActual -= item.Cantidad;

                    var detalle = new DetalleVenta
                    {
                        IdVenta = nuevaVenta.IdVenta,
                        IdProducto = item.IdProducto,
                        Cantidad = item.Cantidad
                    };

                    _context.DetalleVentas.Add(detalle);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { mensaje = "¡Venta y facturación procesada con éxito!", idVenta = nuevaVenta.IdVenta });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { mensaje = "Error interno al procesar la facturación", error = ex.Message });
            }
        }

        // GET: api/Ventas/reporte-factura/5
        [HttpGet("reporte-factura/{id}")]
        public async Task<IActionResult> GetReporteFactura(int id)
        {
            var ventaReporte = await _context.Ventas
                .Where(v => v.IdVenta == id)
                .Select(v => new
                {
                    v.IdVenta,
                    v.Total,
                    v.Impuesto,
                    // Devolvemos el tipo mapeado de forma dinámica
                    MetodoPago = "Efectivo C$", 
                    Cliente = _context.Clientes
                        .Where(c => c.IdCliente == v.IdCliente)
                        .Select(c => new { c.Nombres, c.Apellidos, c.NumDocumento })
                        .FirstOrDefault(),
                    Productos = _context.DetalleVentas
                        .Where(d => d.IdVenta == v.IdVenta)
                        .Select(d => new
                        {
                            d.IdProducto,
                            d.Cantidad,
                            NombreProducto = _context.Productos
                                .Where(p => p.IdProducto == d.IdProducto)
                                .Select(p => p.NombreProducto)
                                .FirstOrDefault()
                        }).ToList()
                })
                .FirstOrDefaultAsync();

            if (ventaReporte == null) 
                return NotFound(new { mensaje = "Factura no encontrada para el reporte." });

            return Ok(ventaReporte);
        }

        // GET: api/Ventas/reporte-maestro
        [HttpGet("reporte-maestro")]
        public async Task<IActionResult> GetReporteMasterDetalle([FromQuery] string periodo = "recientes")
        {
            var query = _context.Ventas.AsQueryable();

            if (periodo.ToLower() == "recientes")
            {
                query = query.OrderByDescending(v => v.IdVenta).Take(20);
            }
            else
            {
                query = query.OrderByDescending(v => v.IdVenta);
            }

            var ventasConsolidadas = await query
                .Select(v => new
                {
                    v.IdVenta,
                    v.Total,
                    v.Impuesto,
                    MetodoPago = "Efectivo/Transferencia",
                    Cliente = _context.Clientes
                        .Where(c => c.IdCliente == v.IdCliente)
                        .Select(c => $"{c.Nombres} {c.Apellidos}")
                        .FirstOrDefault(),
                    ArticulosVendidos = _context.DetalleVentas
                        .Where(d => d.IdVenta == v.IdVenta)
                        .Select(d => new
                        {
                            d.Cantidad,
                            NombreProducto = _context.Productos
                                .Where(p => p.IdProducto == d.IdProducto)
                                .Select(p => p.NombreProducto)
                                .FirstOrDefault()
                        }).ToList()
                }).ToListAsync();

            var totalGenerado = ventasConsolidadas.Sum(v => v.Total);

            return Ok(new
            {
                FiltroPeriodo = periodo,
                TotalGeneralVendido = totalGenerado,
                CantidadVentas = ventasConsolidadas.Count,
                Documentos = ventasConsolidadas
            });
        }
    }
}