using System;
using System.Collections.Generic;

namespace ControlVentas.API.Models;

public partial class PagosVentum
{
    public int IdPago { get; set; }

    public int IdVenta { get; set; }

    public int IdMetodo { get; set; }

    public decimal MontoPagado { get; set; }

    public string? DetallesTransaccion { get; set; }

    public virtual MetodosPago IdMetodoNavigation { get; set; } = null!;

    public virtual Venta IdVentaNavigation { get; set; } = null!;
}
