# Evidencias de SQL Server

Cada captura se conserva con su nombre original. La columna **Razon** explica que paso demuestra.

| Captura |                                             | Razon de la evidencia |
|---|---|
| [181525](<Captura de pantalla 2026-08-24 181525.png>) | Descarga de la imagen oficial de SQL Server 2022 mediante Docker Compose. |
| [182023](<Captura de pantalla 2026-08-24 182023.png>) | Contenedor `mssql-server` iniciado, en estado `healthy`, con el puerto `1433` publicado. |
| [231615](<Captura de pantalla 2026-08-24 231615.png>) | Consulta `ip a` y ejecucion de comandos con `sqlcmd` para administrar el servidor. |
| [231717](<Captura de pantalla 2026-08-24 231717.png>) | Instalacion de `mssql-tools18`, configuracion del repositorio Microsoft y herramientas ODBC. |
| [024237](<Captura de pantalla 2026-08-25 024237.png>) | Consulta de la guia y preparacion de los pasos para instalar `mssql-tools18`. |
| [024312](<Captura de pantalla 2026-08-25 024312.png>) | Revision de los comandos de instalacion y configuracion de SQL Server. |
| [024444](<Captura de pantalla 2026-08-25 024444.png>) | Actualizacion de paquetes requeridos para SQL Server. |
| [024515](<Captura de pantalla 2026-08-25 024515.png>) | Configuracion del repositorio oficial de Microsoft para Ubuntu 24.04. |
| [025248](<Captura de pantalla 2026-08-25 025248.png>) | Consulta de logs y comprobacion del servicio SQL Server. |
| [025427](<Captura de pantalla 2026-08-25 025427.png>) | Instalacion de dependencias de `mssql-tools18`. |
| [025631](<Captura de pantalla 2026-08-25 025631.png>) | Configuracion del `PATH` y verificacion de `sqlcmd`. |
| [025706](<Captura de pantalla 2026-08-25 025706.png>) | Creacion de bases, login `admin` y verificacion de `is_disabled = 0`. |
| [025730](<Captura de pantalla 2026-08-25 025730.png>) | Respaldo exitoso `backup_bd_clase1.bak`; se procesaron 346 paginas. |
