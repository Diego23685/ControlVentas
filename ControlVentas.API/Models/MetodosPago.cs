using System;
using System.Collections.Generic;
using System.Text.Json.Serialization; // <-- 1. AGREGÁ ESTO

namespace ControlVentas.API.Models;

public partial class MetodosPago
{
    public int IdMetodo { get; set; }

    public string NombreMetodo { get; set; } = null!;

    public bool? Estado { get; set; }

    [JsonIgnore] // <-- 2. BLINDAGE: Rompe el ciclo con las tablas de transacciones

    public virtual ICollection<PagosVentum> PagosVenta { get; set; } = new List<PagosVentum>();
}
