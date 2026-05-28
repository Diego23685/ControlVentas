using Microsoft.EntityFrameworkCore;
using ControlVentas.API.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Configurar controladores con protección contra ciclos JSON en las respuestas HTTP
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.WriteIndented = true;
    });

// 2. ⚡ SWAGGER DEFINITIVO: Reemplaza al motor nativo bugeado de .NET 9
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    // Configuramos Swagger para que si encuentra bucles en las tablas de MySQL, no colapse
    options.CustomSchemaIds(type => type.FullName);
});

// 3. Configurar el Contexto de la Base de Datos con MySQL
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=localhost;Port=3306;Database=control_ventas_db;Uid=root;Pwd=admin;";

builder.Services.AddDbContext<VentasDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// 4. Configurar la política de CORS para tu puerto de React (5173)
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
    // Activamos la interfaz gráfica clásica e infalible de Swagger
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("PermitirReact");

app.UseAuthorization();

app.MapControllers();

app.Run();