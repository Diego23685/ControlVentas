using System;
using System.Collections.Generic;
using System.Text.Json.Serialization; // <-- 1. AGREGÁ ESTO

namespace ControlVentas.API.Models;

public partial class Categoria
{
    public int IdCategoria { get; set; }
    public string NombreCategoria { get; set; } = null!;
    public string? Descripcion { get; set; }
    public bool? Estado { get; set; }

    [JsonIgnore] // <-- 2. BLINDAGE: OpenAPI ya no intentará meterse de forma infinita aquí
    public virtual ICollection<Producto> Productos { get; set; } = new List<Producto>();
}