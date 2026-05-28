namespace ControlVentas.API.Dtos
{
    public class TurnoAperturaDto
    {
        public int IdCaja { get; set; }
        public int IdUsuario { get; set; }
        public decimal MontoApertura { get; set; }
    }
}