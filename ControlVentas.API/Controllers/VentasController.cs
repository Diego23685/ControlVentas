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
                // 1. Crear la cabecera de la Venta (Solo asignando los campos base universales)
                var nuevaVenta = new Venta
                {
                    IdCliente = dto.IdCliente,
                    Total = dto.Total,
                    Impuesto = dto.Impuesto
                };

                // Si tus columnas de comprobante o fecha se llaman distinto, C# las ignorará por ahora
                // para permitirte compilar y defender el flujo base.
                _context.Ventas.Add(nuevaVenta);
                await _context.SaveChangesAsync(); 

                // 2. Procesar cada producto del detalle
                foreach (var item in dto.Detalles)
                {
                    var producto = await _context.Productos.FindAsync(item.IdProducto);
                    
                    if (producto == null)
                    {
                        return NotFound(new { mensaje = $"El producto con ID {item.IdProducto} no existe." });
                    }

                    // Validación de inventario usando tu columna real 'StockActual'
                    if (producto.StockActual < item.Cantidad)
                    {
                        return BadRequest(new { mensaje = $"Stock insuficiente para '{producto.NombreProducto}'. Disponible: {producto.StockActual}" });
                    }

                    // Reducir el stock real
                    producto.StockActual -= item.Cantidad;

                    // Instanciamos el detalle usando la clase nativa
                    var detalle = new DetalleVenta
                    {
                        IdVenta = nuevaVenta.IdVenta,
                        IdProducto = item.IdProducto,
                        Cantidad = item.Cantidad
                    };

                    // Corregido: Agregamos directo a la colección en plural de la base de datos (DetalleVentas)
                    _context.Add(detalle);
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
    }
}