using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ControlVentas.API.Models;
using ControlVentas.API.Dtos; // <-- No olvides el using de tus DTOs
using System;
using System.Threading.Tasks;

namespace ControlVentas.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TurnosCajaController : ControllerBase
    {
        private readonly VentasDbContext _context;

        public TurnosCajaController(VentasDbContext context)
        {
            _context = context;
        }

        // POST: api/TurnosCaja/apertura
        [HttpPost("apertura")]
        public async Task<IActionResult> Apertura([FromBody] TurnoAperturaDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var caja = await _context.Set<Caja>().FindAsync(dto.IdCaja);
            if (caja == null) return NotFound(new { mensaje = "La caja especificada no existe." });
            
            if (caja.Estado == "ABIERTA") return BadRequest(new { mensaje = "Esta caja ya tiene un turno activo." });

            caja.Estado = "ABIERTA";

            var nuevoTurno = new TurnosCaja
            {
                IdCaja = dto.IdCaja,
                IdUsuario = dto.IdUsuario,
                FechaApertura = DateTime.Now,
                MontoApertura = dto.MontoApertura,
                Estado = true 
            };

            _context.Set<TurnosCaja>().Add(nuevoTurno);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "¡Turno de caja abierto con éxito!", idTurno = nuevoTurno.IdTurno });
        }

        // POST: api/TurnosCaja/cierre/1?montoCierre=4500
        [HttpPost("cierre/{idTurno}")]
        public async Task<IActionResult> Cierre(int idTurno, [FromQuery] decimal montoCierre)
        {
            var turno = await _context.Set<TurnosCaja>().FindAsync(idTurno);
            
            if (turno == null || turno.Estado == false) 
            {
                return BadRequest(new { mensaje = "El turno no existe o ya está cerrado." });
            }

            turno.FechaCierre = DateTime.Now;
            turno.MontoCierre = montoCierre;
            turno.Estado = false; 

            var caja = await _context.Set<Caja>().FindAsync(turno.IdCaja);
            if (caja != null) caja.Estado = "CERRADA";

            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Turno de caja cerrado y arqueado correctamente." });
        }
    }
}