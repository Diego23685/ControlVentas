using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ControlVentas.API.Models;

// ¡OJO AQUÍ! Asegúrate de que diga Producto y NO Cliente
public partial class Producto
{
    public int IdProducto { get; set; }

    public int IdCategoria { get; set; }

    public int IdMarca { get; set; }

    public string CodigoBarras { get; set; } = null!;

    public string NombreProducto { get; set; } = null!;

    public string? Descripcion { get; set; }

    public decimal PrecioCompra { get; set; }

    public decimal PrecioVenta { get; set; }

    public int StockActual { get; set; }

    public int StockMinimo { get; set; }

    public bool? Estado { get; set; }

    [JsonIgnore]
    public virtual ICollection<DetalleCompra> DetalleCompras { get; set; } = new List<DetalleCompra>();

    [JsonIgnore]
    public virtual ICollection<DetalleVenta> DetalleVenta { get; set; } = new List<DetalleVenta>();

    [JsonIgnore]
    public virtual Categoria? IdCategoriaNavigation { get; set; }

    [JsonIgnore]
    public virtual Marca? IdMarcaNavigation { get; set; }

    [JsonIgnore]
    public virtual ICollection<ImagenesProducto> ImagenesProductos { get; set; } = new List<ImagenesProducto>();

    [JsonIgnore]
    public virtual ICollection<KardexInventario> KardexInventarios { get; set; } = new List<KardexInventario>();
}