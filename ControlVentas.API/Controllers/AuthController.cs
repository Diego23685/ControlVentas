using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ControlVentas.API.Models;
using BCrypt.Net; // <-- Agregado para solucionar los errores de BCrypt

namespace ControlVentas.API.Controllers
{
    public class LoginRequestDto
    {
        public string Username { get; set; } = null!;
        public string Password { get; set; } = null!;
    }

    public class UsuarioRegistroDto
    {
        public int IdRol { get; set; }
        public string Username { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string Nombres { get; set; } = null!;
        public string Apellidos { get; set; } = null!;
        public string Email { get; set; } = null!;
    }

    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly VentasDbContext _context;

        public AuthController(VentasDbContext context)
        {
            _context = context;
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto model)
        {
            var usuario = await _context.Usuarios
                .Include(u => u.IdRolNavigation)
                .FirstOrDefaultAsync(u => u.Username == model.Username);

            // CORRECCIÓN: Comparamos contra false o null ya que Estado es bool?
            if (usuario == null || usuario.Estado == false)
                return Unauthorized(new { mensaje = "Credenciales incorrectas o usuario inactivo." });

            bool passwordValido = false;
            try
            {
                passwordValido = BCrypt.Net.BCrypt.Verify(model.Password, usuario.PasswordHash);
            }
            catch
            {
                passwordValido = (model.Password == usuario.PasswordHash);
            }

            if (!passwordValido)
                return Unauthorized(new { mensaje = "Credenciales incorrectas." });

            return Ok(new {
                mensaje = "¡Ingreso exitoso!",
                idUsuario = usuario.IdUsuario,
                username = usuario.Username,
                nombreCompleto = $"{usuario.Nombres} {usuario.Apellidos}",
                rol = usuario.IdRolNavigation?.NombreRol
            });
        }

        // POST: api/auth/registrar
        [HttpPost("registrar")]
        public async Task<IActionResult> Registrar([FromBody] UsuarioRegistroDto model)
        {
            if (await _context.Usuarios.AnyAsync(u => u.Username == model.Username))
                return BadRequest(new { mensaje = "El nombre de usuario ya existe." });

            if (await _context.Usuarios.AnyAsync(u => u.Email == model.Email))
                return BadRequest(new { mensaje = "El correo electrónico ya está registrado." });

            string passwordHash = BCrypt.Net.BCrypt.HashPassword(model.Password);

            var nuevoUsuario = new Usuario
            {
                IdRol = model.IdRol,
                Username = model.Username,
                PasswordHash = passwordHash,
                Nombres = model.Nombres,
                Apellidos = model.Apellidos,
                Email = model.Email,
                Estado = true // CORRECCIÓN: Asignamos true en vez de 1 porque es bool?
            };

            _context.Usuarios.Add(nuevoUsuario);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Usuario registrado exitosamente con contraseña cifrada." });
        }
    }
}