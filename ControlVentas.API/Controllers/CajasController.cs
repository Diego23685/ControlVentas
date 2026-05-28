using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ControlVentas.API.Models;
using System.Threading.Tasks;

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
            var cajas = await _context.Set<Caja>().ToListAsync();
            return Ok(cajas);
        }

        // POST: api/Cajas (Crear una nueva caja)
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Caja caja)
        {
            caja.IdCaja = 0;
            caja.Estado = "CERRADA"; // Toda caja nueva nace cerrada

            _context.Set<Caja>().Add(caja);
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Caja registrada con éxito", caja });
        }
    }
}