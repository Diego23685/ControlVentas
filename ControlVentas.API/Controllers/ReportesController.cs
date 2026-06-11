using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ControlVentas.API.Models;
using System;
using System.Threading.Tasks;
using System.Linq;

namespace ControlVentas.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportesController : ControllerBase
    {
        private readonly VentasDbContext _context;

        public ReportesController(VentasDbContext context)
        {
            _context = context;
        }

        // GET: api/reportes/filtrado?idCliente=0&idCategoria=0
        // Satisface: Crear reportes filtrados por clientes o categorías de productos
        [HttpGet("filtrado")]
        public async Task<IActionResult> GetReporteFiltrado(
            [FromQuery] int? idCliente, 
            [FromQuery] int? idCategoria)
        {
            // Iniciamos la consulta base desde la tabla intermedia
            var query = _context.DetalleVentas.AsQueryable();

            // Filtro por Cliente (buscando las ventas asociadas a ese cliente)
            if (idCliente.HasValue && idCliente > 0)
            {
                var ventasCliente = _context.Ventas
                    .Where(v => v.IdCliente == idCliente.Value)
                    .Select(v => v.IdVenta);

                query = query.Where(d => ventasCliente.Contains(d.IdVenta));
            }

            // Filtro por Categoría de Productos
            if (idCategoria.HasValue && idCategoria > 0)
            {
                var productosCategoria = _context.Productos
                    .Where(p => p.IdCategoria == idCategoria.Value)
                    .Select(p => p.IdProducto);

                query = query.Where(d => productosCategoria.Contains(d.IdProducto));
            }

            // Consolidamos la data masticada para el reporte dinámico
            var resultado = await query
                .Select(d => new
                {
                    d.IdProducto,
                    d.Cantidad,
                    NombreProducto = _context.Productos
                        .Where(p => p.IdProducto == d.IdProducto)
                        .Select(p => p.NombreProducto)
                        .FirstOrDefault(),
                    Categoria = _context.Categorias
                        .Where(c => c.IdCategoria == (_context.Productos
                            .Where(p => p.IdProducto == d.IdProducto)
                            .Select(p => p.IdCategoria)
                            .FirstOrDefault()))
                        .Select(c => c.NombreCategoria) 
                        .FirstOrDefault()
                })
                .ToListAsync();

            return Ok(new
            {
                Mensaje = "Reporte dinámico generado con éxito",
                FiltrosAplicados = new { idCliente, idCategoria },
                TotalRegistros = resultado.Count,
                Datos = resultado
            });
        }

        // GET: api/reportes/estadisticos-dashboard
        // Satisface: Reportes estadísticos avanzados adaptados al dashboard en React
        [HttpGet("estadisticos-dashboard")]
        public async Task<IActionResult> GetEstadisticosDashboard()
        {
            try
            {
                // Fecha de hoy para las ventas del día
                DateTime hoy = DateTime.Today;

                // 1. INGRESOS DEL DÍA (Suma de la columna 'total' de las ventas del día de hoy)
                decimal totalVentasDia = await _context.Ventas
                    .Where(v => v.FechaVenta.Date == hoy && v.Estado == "PAGADA")
                    .SumAsync(v => v.Total);

                // 2. TRANSACCIONES (Cantidad de facturas emitidas el día de hoy)
                int facturasEmitidas = await _context.Ventas
                    .CountAsync(v => v.FechaVenta.Date == hoy);

                // 3. PRODUCTO ESTRELLA (El repuesto con mayor cantidad total acumulada en 'detalle_ventas')
                var productoEstrellaQuery = await _context.DetalleVentas
                    .GroupBy(d => d.IdProducto)
                    .Select(g => new 
                    { 
                        IdProducto = g.Key, 
                        TotalCantidad = g.Sum(x => x.Cantidad) 
                    })
                    .OrderByDescending(x => x.TotalCantidad)
                    .FirstOrDefaultAsync();

                string productoEstrella = "Sin ventas registradas";
                if (productoEstrellaQuery != null)
                {
                    productoEstrella = await _context.Productos
                        .Where(p => p.IdProducto == productoEstrellaQuery.IdProducto)
                        .Select(p => p.NombreProducto)
                        .FirstOrDefaultAsync() ?? "Sin ventas registradas";
                }

                // 4. ALERTAS DE INVENTARIO (Mapeado exacto con camelCase que espera React)
                // Trae los repuestos activos cuyo stock actual está por debajo o igual al mínimo
                var productosCriticos = await _context.Productos
                    .Where(p => p.Estado == true && p.StockActual <= p.StockMinimo)
                    .Select(p => new 
                    { 
                        idProducto = p.IdProducto, 
                        nombreProducto = p.NombreProducto, 
                        stockActual = p.StockActual 
                    })
                    .ToListAsync();

                return Ok(new
                {
                    totalVentasDia,
                    facturasEmitidas,
                    productoEstrella,
                    productosCriticos
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error crítico al compilar métricas reales: " + ex.Message });
            }
        }
    }
}