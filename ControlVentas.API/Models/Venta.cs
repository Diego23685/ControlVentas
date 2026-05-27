using System;
using System.Collections.Generic;

namespace ControlVentas.API.Models;

public partial class Venta
{
    public int IdVenta { get; set; }

    public int IdCliente { get; set; }

    public int IdUsuario { get; set; }

    public int IdTurno { get; set; }

    public string NumFactura { get; set; } = null!;

    public DateTime FechaVenta { get; set; }

    public decimal Subtotal { get; set; }

    public decimal Impuesto { get; set; }

    public decimal Descuento { get; set; }

    public decimal Total { get; set; }

    public string Estado { get; set; } = null!;

    public virtual ICollection<DetalleVenta> DetalleVenta { get; set; } = new List<DetalleVenta>();

    public virtual ICollection<Devolucione> Devoluciones { get; set; } = new List<Devolucione>();

    public virtual Cliente IdClienteNavigation { get; set; } = null!;

    public virtual TurnosCaja IdTurnoNavigation { get; set; } = null!;

    public virtual Usuario IdUsuarioNavigation { get; set; } = null!;

    public virtual ICollection<PagosVentum> PagosVenta { get; set; } = new List<PagosVentum>();
}
