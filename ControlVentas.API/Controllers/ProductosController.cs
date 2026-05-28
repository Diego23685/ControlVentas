using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ControlVentas.API.Models;

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

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var productos = await _context.Productos.ToListAsync();
            return Ok(productos);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Producto producto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            
            _context.Productos.Add(producto);
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Producto registrado con éxito", producto });
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