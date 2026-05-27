using System;
using System.Collections.Generic;

namespace ControlVentas.API.Models;

public partial class Devolucione
{
    public int IdDevolucion { get; set; }

    public int IdVenta { get; set; }

    public int IdUsuario { get; set; }

    public DateTime FechaDevolucion { get; set; }

    public string Motivo { get; set; } = null!;

    public decimal MontoDevuelto { get; set; }

    public virtual Usuario IdUsuarioNavigation { get; set; } = null!;

    public virtual Venta IdVentaNavigation { get; set; } = null!;
}
