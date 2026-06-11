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
    public class CajasController : ControllerBase
    {
        private readonly VentasDbContext _context;

        public CajasController(VentasDbContext context)
        {
            _context = context;
        }

        // GET: api/Cajas (Para listar las cajas en React)
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var cajas = await _context.Set<Caja>()
                .Where(c => c.Estado != "INACTIVA")
                .ToListAsync();
            return Ok(cajas);
        }

        // POST: api/Cajas (Crear una nueva caja)
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Caja caja)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                caja.IdCaja = 0;
                caja.Estado = "CERRADA"; // Toda caja nueva nace cerrada por defecto

                _context.Set<Caja>().Add(caja);
                await _context.SaveChangesAsync();
                return Ok(new { mensaje = "Caja registrada con éxito", caja });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al insertar la caja en MySQL: " + ex.Message });
            }
        }

        // ⚙️ INYECTADO: PUT api/Cajas/5 (Para renombrar la caja física)
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Caja cajaData)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var caja = await _context.Set<Caja>().FindAsync(id);
            if (caja == null) return NotFound(new { mensaje = "Caja física no encontrada." });

            try
            {
                caja.NombreCaja = cajaData.NombreCaja;
                
                // Si el frontend envía un cambio de estado manual lo asimilamos, si no lo dejamos intacto
                if (!string.IsNullOrEmpty(cajaData.Estado)) caja.Estado = cajaData.Estado;

                await _context.SaveChangesAsync();
                return Ok(new { mensaje = "Caja modificada con éxito en el sistema", caja });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error crítico al actualizar: " + ex.Message });
            }
        }

        // ⚙️ INYECTADO: DELETE api/Cajas/5 (Borrado Lógico Protectivo)
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var caja = await _context.Set<Caja>().FindAsync(id);
            if (caja == null) return NotFound(new { mensaje = "La caja especificada no existe." });

            try
            {
                // 🛡️ REGLA DE INTEGRIDAD FÍNANCIERA: Verificamos si la caja tiene un turno operativo amarrado y activo (true)
                // para que el administrador no borre una caja que un cajero está usando en caliente para facturar.
                var tieneTurnoActivo = await _context.Set<TurnosCaja>()
                    .AnyAsync(t => t.IdCaja == id && (t.Estado == true || t.MontoCierre == null));

                if (tieneTurnoActivo)
                {
                    return BadRequest(new { mensaje = "Operación denegada: La caja tiene un turno operativo abierto en este momento." });
                }

                // Esto protege el historial de la uq_num_factura y las relaciones de la tabla 'ventas'
                caja.Estado = "INACTIVA";
                
                await _context.SaveChangesAsync();
                return Ok(new { mensaje = "Caja dada de baja del sistema correctamente." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al procesar la baja lógica en MySQL: " + ex.Message });
            }
        }
    }
}