using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ControlVentas.API.Models;
using System;
using System.Threading.Tasks;

namespace ControlVentas.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriasController : ControllerBase
    {
        private readonly VentasDbContext _context;

        public CategoriasController(VentasDbContext context)
        {
            _context = context;
        }

        // GET: api/Categorias (Para cargar los dropdowns/combobox en React)
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            // Traemos solo las categorías activas o todas para el mantenimiento
            var categorias = await _context.Categorias.ToListAsync();
            return Ok(categorias);
        }

        // POST: api/Categorias (Crear nueva categoría)
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Categoria categoria)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Forzamos el autoincrementable asegurando que el ID vaya en 0
            categoria.IdCategoria = 0;
            
            // Por defecto, toda categoría nueva entra activa
            if (categoria.Estado == null) categoria.Estado = true;

            _context.Categorias.Add(categoria);
            await _context.SaveChangesAsync();
            
            return Ok(new { mensaje = "Categoría registrada con éxito", categoria });
        }

        // PUT: api/Categorias/5 (Editar nombre o descripción)
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Categoria categoriaData)
        {
            var categoria = await _context.Categorias.FindAsync(id);
            if (categoria == null) return NotFound(new { mensaje = "Categoría no encontrada" });

            // Mapeo directo a tus columnas reales de la captura
            categoria.NombreCategoria = categoriaData.NombreCategoria;
            categoria.Descripcion = categoriaData.Descripcion;
            categoria.Estado = categoriaData.Estado;

            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Categoría actualizada con éxito" });
        }

        // DELETE: api/Categorias/5 (Borrado lógico usando la columna estado)
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var categoria = await _context.Categorias.FindAsync(id);
            if (categoria == null) return NotFound(new { mensaje = "Categoría no encontrada" });

            // Aplicamos borrado lógico para no romper la integridad de los productos asociados
            categoria.Estado = false;

            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Categoría desactivada con éxito" });
        }
    }
}