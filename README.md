# Sistema POS y Control de Inventario para Repuestos

Este proyecto es una solución full-stack maestro-detalle diseñada para la gestión contable, facturación electrónica en tiempo real, arqueo de turnos de caja y control de inventario de repuestos. Desarrollado como parte del **Proyecto Integrador I** en la **UNAN-León**.

---

## Arquitectura del Sistema
El ecosistema se divide en dos módulos independientes completamente desacoplados:
* **Backend (`ControlVentas.API`):** API REST estructurada en **.NET 9 / .NET 10** utilizando Entity Framework Core para la persistencia de datos.
* **Frontend (`control-ventas-ui`):** Interfaz de usuario (UI) moderna construida en **React**, empaquetada con **Vite** y estilizada con variables CSS nativas.
* **Base de Datos:** Motor relacional **MySQL Server** con restricciones de unicidad e integridad referencial en cascada controlada.

---

## Requisitos Previos
Antes de levantar el proyecto, asegúrate de tener instalado en tu estación de trabajo:
1.  [.NET 9.0 SDK](https://dotnet.microsoft.com/download) o superior.
2.  [Node.js](https://nodejs.org/) (Versión LTS recomendada).
3.  [MySQL Server 8.0](https://dev.mysql.com/downloads/installer/) y MySQL Workbench.

---

## Instrucciones de Levantamiento

### 1. Configuración de la Base de Datos (MySQL)
1. Abre **MySQL Workbench** y entra a tu instancia local.
2. Crea un nuevo esquema llamado `control_ventas_db`.
3. Importa o ejecuta el archivo de respaldo (`.sql` / Dump) provisto para poblar el diccionario de datos inicial (tablas de `productos`, `cajas`, `usuarios`, `metodos_pago`, etc.).

### 2. Levantar el Servidor Backend (.NET)
Abre tu terminal favorita (CMD o PowerShell) en la raíz del proyecto y desplázate al directorio de la API:

```bash
cd ControlVentas.API
