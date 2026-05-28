using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ControlVentas.API.Models;

namespace ControlVentas.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClientesController : ControllerBase
    {
        private readonly VentasDbContext _context;

        public ClientesController(VentasDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var clientes = await _context.Clientes.ToListAsync();
            return Ok(clientes);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Cliente cliente)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            _context.Clientes.Add(cliente);
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Cliente registrado con éxito", cliente });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Cliente clienteData)
        {
            var cliente = await _context.Clientes.FindAsync(id);
            if (cliente == null) return NotFound(new { mensaje = "Cliente no encontrado" });

            cliente.NumDocumento = clienteData.NumDocumento;
            cliente.Nombres = clienteData.Nombres;
            cliente.Apellidos = clienteData.Apellidos;
            cliente.Telefono = clienteData.Telefono;
            cliente.Direccion = clienteData.Direccion;
            cliente.Email = clienteData.Email;

            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Cliente actualizado con éxito" });
        }

        // DELETE: api/Clientes/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var cliente = await _context.Clientes.FindAsync(id);
            if (cliente == null) return NotFound(new { mensaje = "Cliente no encontrado" });

            try
            {
                _context.Clientes.Remove(cliente);
                await _context.SaveChangesAsync();
                return Ok(new { mensaje = "Cliente eliminado con éxito" });
            }
            catch (Exception)
            {
                // Si el cliente ya tiene ventas, MySQL impedirá el borrado físico
                return BadRequest(new { mensaje = "No se puede eliminar el cliente porque tiene un historial de ventas asociado." });
            }
        }
    }
}