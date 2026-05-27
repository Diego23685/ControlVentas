using System;
using System.Collections.Generic;

namespace ControlVentas.API.Models;

public partial class ImagenesProducto
{
    public int IdImagen { get; set; }

    public int IdProducto { get; set; }

    public string RutaUrl { get; set; } = null!;

    public bool EsPrincipal { get; set; }

    public virtual Producto IdProductoNavigation { get; set; } = null!;
}
