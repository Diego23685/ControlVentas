using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ControlVentas.API.Models;

namespace ControlVentas.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProveedoresController : ControllerBase
    {
        private readonly VentasDbContext _context;

        public ProveedoresController(VentasDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var proveedores = await _context.Proveedores.ToListAsync();
            return Ok(proveedores);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Proveedore proveedor)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            _context.Proveedores.Add(proveedor);
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Proveedor registrado con éxito", proveedor });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Proveedore proveedorData)
        {
            var proveedor = await _context.Proveedores.FindAsync(id);
            if (proveedor == null) return NotFound(new { mensaje = "Proveedor no encontrado" });

            proveedor.Ruc = proveedorData.Ruc;
            proveedor.RazonSocial = proveedorData.RazonSocial;
            proveedor.NombreContacto = proveedorData.NombreContacto;
            proveedor.Telefono = proveedorData.Telefono;
            proveedor.Direccion = proveedorData.Direccion;
            proveedor.Email = proveedorData.Email;
            proveedor.Estado = proveedorData.Estado;

            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Proveedor actualizado con éxito" });
        }
    }
}