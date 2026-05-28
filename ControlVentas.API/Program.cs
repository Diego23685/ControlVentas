using Microsoft.EntityFrameworkCore;
using ControlVentas.API.Models;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Configurar controladores con protección contra ciclos JSON en las respuestas HTTP
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.WriteIndented = true;
    });

// 2. Configuración nativa de OpenAPI (.NET 9) limpia
builder.Services.AddOpenApi();

// 3. Forzar la inyección global de configuraciones JSON para las APIs mínimas y OpenAPI
builder.Services.Configure<Microsoft.AspNetCore.Http.Json.JsonOptions>(options =>
{
    options.SerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});

// 4. Configurar el Contexto de la Base de Datos con MySQL
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=localhost;Port=3306;Database=control_ventas_db;Uid=root;Pwd=admin;";

builder.Services.AddDbContext<VentasDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// 5. Configurar la política de CORS para tu puerto de React (5173)
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
// CONFIGURACIÓN DEL PIPELINE DE PETICIONES (MIDDLEWARES)
// =========================================================================

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi(); 
    app.MapScalarApiReference(); 
}

app.UseCors("PermitirReact");

app.UseAuthorization();

app.MapControllers();

app.Run();