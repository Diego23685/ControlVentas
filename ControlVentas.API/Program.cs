using Microsoft.EntityFrameworkCore;
using ControlVentas.API.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Agregar soporte para los Controladores (Rutas de la API)
builder.Services.AddControllers();

// 2. Configurar el Contexto de la Base de Datos con MySQL
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=localhost;Port=3306;Database=control_ventas_db;Uid=root;Pwd=admin;";

builder.Services.AddDbContext<VentasDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// 3. Configurar la política de CORS EXACTA para tu puerto de React (5173)
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirReact", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // El puerto donde corre tu Vite
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// =========================================================================
// CONFIGURACIÓN DEL PIPELINE DE PETICIONES (MIDDLEWARES)
// =========================================================================

// NOTA: Quitamos 'app.UseHttpsRedirection()' para evitar que choque con tu HTTP local

// 4. Activar CORS usando la política que creamos arriba (DEBE ir antes de Authorization)
app.UseCors("PermitirReact");

app.UseAuthorization();

// 5. Mapear las rutas de tus controladores (como /api/auth/login)
app.MapControllers();

app.Run();