using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ControlVentas.API.Models;
using System;
using System.Threading.Tasks;

namespace ControlVentas.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductosController : ControllerBase
    {
        private readonly VentasDbContext _context;

        public ProductosController(VentasDbContext context)
        {
            _context = context;
        }

        // GET: api/Productos (Corregido para respetar el borrado lógico)
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var productos = await _context.Productos
                .Where(p => p.Estado == true || p.Estado == null)
                .ToListAsync();

            return Ok(productos);
        }

        // POST: api/Productos
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Producto producto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            
            try
            {
                // Forzamos el ID en cero para que MySQL asigne el AutoIncrement de forma transparente
                producto.IdProducto = 0;

                // Anulamos las navegaciones pesadas por seguridad antes de almacenar en la base de datos
                producto.IdCategoriaNavigation = null;
                producto.IdMarcaNavigation = null;

                _context.Productos.Add(producto);
                await _context.SaveChangesAsync();
                return Ok(new { mensaje = "Producto registrado con éxito", producto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error crítico de persistencia en MySQL: " + ex.InnerException?.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Producto productoData)
        {
            var producto = await _context.Productos.FindAsync(id);
            if (producto == null) return NotFound(new { mensaje = "Producto no encontrado" });

            producto.NombreProducto = productoData.NombreProducto;
            producto.CodigoBarras = productoData.CodigoBarras;
            producto.Descripcion = productoData.Descripcion;
            producto.PrecioCompra = productoData.PrecioCompra;
            producto.PrecioVenta = productoData.PrecioVenta;
            producto.StockActual = productoData.StockActual;
            producto.StockMinimo = productoData.StockMinimo;
            producto.Estado = productoData.Estado;
            producto.IdCategoria = productoData.IdCategoria;
            producto.IdMarca = productoData.IdMarca;

            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Producto actualizado con éxito" });
        }

        // DELETE: api/Productos/5 (Borrado lógico para proteger el historial)
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var producto = await _context.Productos.FindAsync(id);
            if (producto == null) return NotFound(new { mensaje = "Producto no encontrado" });

            // Cambiamos el estado a falso para desactivarlo
            producto.Estado = false;
            
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Producto desactivado con éxito" });
        }
    }
}