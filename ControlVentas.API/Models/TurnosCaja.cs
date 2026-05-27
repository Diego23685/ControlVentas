using System;
using System.Collections.Generic;

namespace ControlVentas.API.Models;

public partial class TurnosCaja
{
    public int IdTurno { get; set; }

    public int IdCaja { get; set; }

    public int IdUsuario { get; set; }

    public DateTime FechaApertura { get; set; }

    public DateTime? FechaCierre { get; set; }

    public decimal MontoApertura { get; set; }

    public decimal? MontoCierre { get; set; }

    public bool? Estado { get; set; }

    public virtual Caja IdCajaNavigation { get; set; } = null!;

    public virtual Usuario IdUsuarioNavigation { get; set; } = null!;

    public virtual ICollection<Venta> Venta { get; set; } = new List<Venta>();
}
