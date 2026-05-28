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
                        .Select(c => c.NombreCategoria) // Ajusta si en tu tabla es 'Nombre'
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
        // Satisface: Reportes estadísticos avanzados (Top Productos y Totales por Categoría)
        [HttpGet("estadisticos-dashboard")]
        public async Task<IActionResult> GetEstadisticosDashboard()
        {
            // 1. Top 5 Productos más vendidos (Ideal para gráficas de barras en React)
            var topProductos = await _context.DetalleVentas
                .GroupBy(d => d.IdProducto)
                .Select(g => new
                {
                    IdProducto = g.Key,
                    TotalVendido = g.Sum(d => d.Cantidad),
                    NombreProducto = _context.Productos
                        .Where(p => p.IdProducto == g.Key)
                        .Select(p => p.NombreProducto)
                        .FirstOrDefault()
                })
                .OrderByDescending(p => p.TotalVendido)
                .Take(5)
                .ToListAsync();

            // 2. Cantidad de productos en stock por debajo del mínimo (Alertas Operativas)
            var alertasStock = await _context.Productos
                .Where(p => p.StockActual <= p.StockMinimo)
                .Select(p => new { p.IdProducto, p.NombreProducto, p.StockActual, p.StockMinimo })
                .ToListAsync();

            // 3. Resumen macro financiero
            var totalVentasContadas = await _context.Ventas.SumAsync(v => v.Total);
            var cantidadClientesActivos = await _context.Clientes.CountAsync();

            return Ok(new
            {
                ResumenFinanciero = new {
                    TotalRecaudado = totalVentasContadas,
                    ClientesRegistrados = cantidadClientesActivos
                },
                TopProductosMasVendidos = topProductos,
                AlertasDeInventario = new {
                    CantidadCriticos = alertasStock.Count,
                    ProductosAgotados = alertasStock
                }
            });
        }
    }
}