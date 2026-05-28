using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ControlVentas.API.Models;
using System;
using System.Threading.Tasks;

namespace ControlVentas.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MarcasController : ControllerBase
    {
        private readonly VentasDbContext _context;

        public MarcasController(VentasDbContext context)
        {
            _context = context;
        }

        // GET: api/Marcas (Para listar en tus tablas o combobox de React)
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var marcas = await _context.Marcas.ToListAsync();
            return Ok(marcas);
        }

        // POST: api/Marcas (Crear una marca nueva, ej: Honda, Suzuki, Castrol)
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Marca marca)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Aseguramos el autoincrementable obligando al ID a ir en 0
            marca.IdMarca = 0;

            _context.Marcas.Add(marca);
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Marca registrada con éxito", marca });
        }

        // PUT: api/Marcas/5 (Editar nombre de la marca)
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Marca marcaData)
        {
            var marca = await _context.Marcas.FindAsync(id);
            if (marca == null) return NotFound(new { mensaje = "Marca no encontrada" });

            // Mapeo directo a tu columna de la base de datos
            marca.NombreMarca = marcaData.NombreMarca;

            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Marca actualizada con éxito" });
        }

        // DELETE: api/Marcas/5 (Remover físicamente o lógico si te lo pide la integridad)
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var marca = await _context.Marcas.FindAsync(id);
            if (marca == null) return NotFound(new { mensaje = "Marca no encontrada" });

            try
            {
                _context.Marcas.Remove(marca);
                await _context.SaveChangesAsync();
                return Ok(new { mensaje = "Marca eliminada con éxito del sistema" });
            }
            catch (Exception)
            {
                return BadRequest(new { mensaje = "No se puede eliminar la marca porque ya tiene productos asociados en el inventario." });
            }
        }
    }
}