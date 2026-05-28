using System.Collections.Generic;

namespace ControlVentas.API.Dtos
{
    public class VentaCreateDto
    {
        public int IdCliente { get; set; }
        public int IdUsuario { get; set; }     // <-- NUEVO: Cajero logueado en React
        public int IdTurno { get; set; }       // <-- NUEVO: El turno que abrió el cajero
        public int IdMetodoPago { get; set; }
        public string TipoComprobante { get; set; } = null!; 
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