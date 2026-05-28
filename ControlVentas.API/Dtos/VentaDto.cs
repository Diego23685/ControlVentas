using System.Collections.Generic;

namespace ControlVentas.API.Dtos
{
    public class VentaCreateDto
    {
        public int IdCliente { get; set; }
        public int IdMetodoPago { get; set; } // <-- ÚNICA ADICIÓN: Para amarrar el pago
        public string TipoComprobante { get; set; } = null!; // "Factura", "Recibo"
        public string NumComprobante { get; set; } = null!;
        public decimal Impuesto { get; set; }
        public decimal Total { get; set; }
        public List<DetalleVentaDto> Detalles { get; set; } = new List<DetalleVentaDto>();
    }

    public class DetalleVentaDto
    {
        public int IdProducto { get; set; }
        public int Cantidad { get; set; }
        public decimal PrecioVenta { get; set; }
        public decimal Descuento { get; set; }
    }
}