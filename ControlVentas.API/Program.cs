using Microsoft.EntityFrameworkCore;
using ControlVentas.API.Models;
using Scalar.AspNetCore; // <-- 1. AGREGAR ESTE USING

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// Generador de especificación nativo de .NET 9
builder.Services.AddOpenApi();

// Configurar Contexto MySQL
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=localhost;Port=3306;Database=control_ventas_db;Uid=root;Pwd=admin;";

builder.Services.AddDbContext<VentasDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// Configurar CORS para React
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirReact", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// =========================================================================
// PIPELINE DE PETICIONES
// =========================================================================
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi(); // Mapea el JSON que ya viste
    
    // 2. AGREGAR ESTA LÍNEA para renderizar la interfaz gráfica usando el JSON nativo
    app.MapScalarApiReference(); 
}

app.UseCors("PermitirReact");
app.UseAuthorization();
app.MapControllers();

app.Run();