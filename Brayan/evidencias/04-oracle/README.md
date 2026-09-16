# Evidencias de Oracle XE

Cada captura se conserva con su nombre original. La columna **Razon** explica que paso demuestra.

| Captura|                                              | Razon de la evidencia |
|---|---|
| [173535](<Captura de pantalla 2026-08-25 173535.png>) | Inicio de la configuracion de Oracle XE. |
| [174142](<Captura de pantalla 2026-08-25 174142.png>) | Preparacion de la conexion y comandos de Oracle. |
| [174354](<Captura de pantalla 2026-08-25 174354.png>) | Verificacion previa del servicio Oracle. |
| [205237](<Captura de pantalla 2026-08-25 205237.png>) | Creacion del `docker-compose.yml`, volumenes y regla UFW para el puerto `1521`. |
| [205256](<Captura de pantalla 2026-08-25 205256.png>) | Firewall activo con los puertos de los cuatro motores permitidos. |
| [205358](<Captura de pantalla 2026-08-25 205358.png>) | Archivo `.env` y `README.md` de Oracle XE. |
| [205730](<Captura de pantalla 2026-08-25 205730.png>) | Diagnostico del primer arranque fallido por volumen sin las carpetas de datos de Oracle. |
| [210234](<Captura de pantalla 2026-08-25 210234.png>) | Verificacion de volumenes montados en Oracle: datos persistentes y carpeta de respaldos. |
| [210958](<Captura de pantalla 2026-08-25 210958.png>) | Prueba del arranque del contenedor Oracle. |
| [211020](<Captura de pantalla 2026-08-25 211020.png>) | Ajustes durante la inicializacion de Oracle. |
| [211147](<Captura de pantalla 2026-08-25 211147.png>) | Conexion como `SYS` y comienzo de la creacion del usuario Oracle. |
| [211214](<Captura de pantalla 2026-08-25 211214.png>) | Usuario `BRAYAN` creado, permisos concedidos y conexion exitosa; no habia tablas aun. |
| [211236](<Captura de pantalla 2026-08-25 211236.png>) | Consulta `ip a` que confirma la IP `172.21.205.26` para Oracle. |
| [211300](<Captura de pantalla 2026-08-25 211300.png>) | Exportacion Data Pump corregida y completada; se genero `backup_tecnogua.dmp` de 304K. |
| [213721](<Captura de pantalla 2026-08-25 213721.png>) | Resumen en DBeaver de las conexiones remotas: SQL Server `1433`, MySQL `3306`, PostgreSQL `5432` y Oracle `1521`. |
