using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ControlVentas.API.Models;

public partial class Cliente
{
    public int IdCliente { get; set; }

    public string NumDocumento { get; set; } = null!;

    public string Nombres { get; set; } = null!;

    public string Apellidos { get; set; } = null!;

    public string? Telefono { get; set; }

    public string? Direccion { get; set; }

    public string? Email { get; set; }

    [JsonIgnore]
    public virtual ICollection<Venta> Venta { get; set; } = new List<Venta>();
}