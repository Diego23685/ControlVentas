using System;
using System.Collections.Generic;

namespace ControlVentas.API.Models;

public partial class MetodosPago
{
    public int IdMetodo { get; set; }

    public string NombreMetodo { get; set; } = null!;

    public bool? Estado { get; set; }

    public virtual ICollection<PagosVentum> PagosVenta { get; set; } = new List<PagosVentum>();
}
