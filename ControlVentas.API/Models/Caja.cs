using System;
using System.Collections.Generic;

namespace ControlVentas.API.Models;

public partial class Caja
{
    public int IdCaja { get; set; }

    public string NombreCaja { get; set; } = null!;

    public string Estado { get; set; } = null!;

    public virtual ICollection<TurnosCaja> TurnosCajas { get; set; } = new List<TurnosCaja>();
}
