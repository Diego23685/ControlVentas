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

    public class MenuItemDto
    {
        public string Texto { get; set; } = null!;
        public string Ruta { get; set; } = null!;
        public string Icono { get; set; } = null!;
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

        // GET: api/auth/menu?rol=Administrador
        [HttpGet("menu")]
        public IActionResult ObtenetMenu([FromQuery] string rol)
        {
            var menu = new List<MenuItemDto>();

            if (string.IsNullOrEmpty(rol))
                return BadRequest(new { mensaje = "El rol es requerido." });

            // Opciones base para TODOS los usuarios logueados
            menu.Add(new MenuItemDto { Texto = "Inicio", Ruta = "/dashboard", Icono = "HomeIcon" });

            // Filtramos de forma estricta según el rol real en tu MySQL
            if (rol == "Administrador")
            {
                // El Admin mira absolutamente todo, incluyendo catálogos, personal y reportería avanzada
                menu.Add(new MenuItemDto { Texto = "Inventario / Productos", Ruta = "/productos", Icono = "BoxIcon" });
                menu.Add(new MenuItemDto { Texto = "Gestión de Usuarios", Ruta = "/usuarios", Icono = "UsersIcon" });
                menu.Add(new MenuItemDto { Texto = "Clientes", Ruta = "/clientes", Icono = "UserGroupIcon" });
                menu.Add(new MenuItemDto { Texto = "Nueva Venta", Ruta = "/ventas/nueva", Icono = "ShoppingCartIcon" });
                menu.Add(new MenuItemDto { Texto = "Historial de Ventas", Ruta = "/ventas/historial", Icono = "DocumentTextIcon" });
                menu.Add(new MenuItemDto { Texto = "Reportes Estadísticos", Ruta = "/reportes", Icono = "ChartBarIcon" });
            }
            else if (rol == "Cajero")
            {
                // El Cajero solo puede facturar, ver clientes y revisar el historial de lo que ha vendido
                menu.Add(new MenuItemDto { Texto = "Nueva Venta", Ruta = "/ventas/nueva", Icono = "ShoppingCartIcon" });
                menu.Add(new MenuItemDto { Texto = "Clientes", Ruta = "/clientes", Icono = "UserGroupIcon" });
                menu.Add(new MenuItemDto { Texto = "Historial de Ventas", Ruta = "/ventas/historial", Icono = "DocumentTextIcon" });
            }
            else
            {
                return Unauthorized(new { mensaje = "Rol no reconocido en el sistema base." });
            }

            return Ok(menu);
        }
    }
}