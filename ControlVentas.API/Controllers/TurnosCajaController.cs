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
    public class TurnosCajaController : ControllerBase
    {
        private readonly VentasDbContext _context;

        public TurnosCajaController(VentasDbContext context)
        {
            _context = context;
        }

        // GET: api/TurnosCaja
        // Satisface: Listar el historial de turnos y arqueos para el administrador en React
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var turnos = await _context.Set<TurnosCaja>()
                .OrderByDescending(t => t.IdTurno) // Los más recientes primero
                .Select(t => new
                {
                    t.IdTurno,
                    t.IdCaja,
                    // Traemos el nombre real de la caja física haciendo un JOIN en caliente
                    NombreCaja = _context.Set<Caja>()
                        .Where(c => c.IdCaja == t.IdCaja)
                        .Select(c => c.NombreCaja)
                        .FirstOrDefault() ?? "Caja Desconocida",
                    t.IdUsuario,
                    // Traemos el username del cajero asignado
                    Cajero = _context.Set<Usuario>()
                        .Where(u => u.IdUsuario == t.IdUsuario)
                        .Select(u => u.Username)
                        .FirstOrDefault() ?? "Usuario Desconocida",
                    t.FechaApertura,
                    t.FechaCierre,
                    t.MontoApertura,
                    t.MontoCierre,
                    // Si t.Estado es true (1) significa ABIERTO, si es false (0) significa CERRADO
                    EstadoTurno = t.Estado == true ? "ABIERTO" : "CERRADO"
                })
                .ToListAsync();

            return Ok(turnos);
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