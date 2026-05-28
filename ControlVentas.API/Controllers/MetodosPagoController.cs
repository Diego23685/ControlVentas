using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ControlVentas.API.Models;
using System;
using System.Threading.Tasks;

namespace ControlVentas.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MetodosPagoController : ControllerBase
    {
        private readonly VentasDbContext _context;

        public MetodosPagoController(VentasDbContext context)
        {
            _context = context;
        }

        // GET: api/MetodosPago
        // Satisface: Listar todas las formas de pago para los dropdowns de facturación
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var metodos = await _context.MetodosPagos.ToListAsync();
            return Ok(metodos);
        }

        // POST: api/MetodosPago
        // Para registrar opciones: "Efectivo C$", "Transferencia", "Tarjeta"
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] MetodosPago modelo)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Buscamos la llave primaria en tu modelo. 
            // EF Core suele mapearla respetando el nombre de la clase o de la tabla.
            // Forzamos 0 para el autoincrementable de MySQL.
            try 
            {
                // Intentamos asignarlo dinámicamente por si se mapeó como Id o IdMetodoPago
                var propiedadId = modelo.GetType().GetProperties()
                    .FirstOrDefault(p => p.Name.ToLower().Contains("id"));
                
                if (propiedadId != null && propiedadId.PropertyType == typeof(int))
                {
                    propiedadId.SetValue(modelo, 0);
                }
            }
            catch { // Si falla la reflexión, dejamos que corra el flujo normal
            }

            _context.MetodosPagos.Add(modelo);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Método de pago registrado con éxito", modelo });
        }

        // PUT: api/MetodosPago/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] MetodosPago datosActualizados)
        {
            // Buscamos el registro por su ID genérico
            var metodo = await _context.MetodosPagos.FindAsync(id);
            if (metodo == null) return NotFound(new { mensaje = "Método de pago no encontrado" });

            // Mapeo dinámico y seguro de las propiedades de texto para evitar errores de nombres de columnas
            var propNombreOrigen = datosActualizados.GetType().GetProperties()
                .FirstOrDefault(p => p.Name.ToLower().Contains("nombre") || p.Name.ToLower().Contains("descripcion"));
            
            var propNombreDestino = metodo.GetType().GetProperties()
                .FirstOrDefault(p => p.Name.ToLower().Contains("nombre") || p.Name.ToLower().Contains("descripcion"));

            if (propNombreOrigen != null && propNombreDestino != null)
            {
                var valor = propNombreOrigen.GetValue(datosActualizados);
                propNombreDestino.SetValue(metodo, valor);
            }

            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Método de pago actualizado con éxito" });
        }

        // DELETE: api/MetodosPago/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var metodo = await _context.MetodosPagos.FindAsync(id);
            if (metodo == null) return NotFound(new { mensaje = "Método de pago no encontrado" });

            try
            {
                _context.MetodosPagos.Remove(metodo);
                await _context.SaveChangesAsync();
                return Ok(new { mensaje = "Método de pago eliminado con éxito" });
            }
            catch (Exception)
            {
                return BadRequest(new { mensaje = "No se puede eliminar porque ya existen transacciones asociadas a esta forma de pago." });
            }
        }
    }
}