using System;
using System.Collections.Generic;

namespace ControlVentas.API.Models;

public partial class KardexInventario
{
    public int IdKardex { get; set; }

    public int IdProducto { get; set; }

    public string TipoMovimiento { get; set; } = null!;

    public string Origen { get; set; } = null!;

    public int IdReferencia { get; set; }

    public int Cantidad { get; set; }

    public int StockAnterior { get; set; }

    public int StockPosterior { get; set; }

    public DateTime? FechaMovimiento { get; set; }

    public virtual Producto IdProductoNavigation { get; set; } = null!;
}
