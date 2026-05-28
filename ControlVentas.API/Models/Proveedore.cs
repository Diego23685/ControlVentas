using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ControlVentas.API.Models;

public partial class Proveedore
{
    public int IdProveedor { get; set; }

    public string Ruc { get; set; } = null!;

    public string RazonSocial { get; set; } = null!;

    public string? NombreContacto { get; set; }

    public string? Telefono { get; set; }

    public string? Direccion { get; set; }

    public string? Email { get; set; }

    public bool? Estado { get; set; }

    [JsonIgnore]
    public virtual ICollection<Compra> Compras { get; set; } = new List<Compra>();
}