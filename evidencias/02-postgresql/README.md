# Evidencias de PostgreSQL

Cada captura se conserva con su nombre original. La columna **Razon** explica que paso demuestra.

| Captura|                                              | Razon de la evidencia |
|---|---|
| [091719](<Captura de pantalla 2026-08-23 091719.png>) | Consulta `\l` que muestra las bases existentes: `bd_clase1`, `postgres`, `tecnogua`, `template0` y `template1`. |
| [093530](<Captura de pantalla 2026-08-23 093530.png>) | Seleccion del controlador PostgreSQL en DBeaver. |
| [093554](<Captura de pantalla 2026-08-23 093554.png>) | Conexion remota de PostgreSQL visible en DBeaver mediante `172.21.205.26:5432`. |
| [093648](<Captura de pantalla 2026-08-23 093648.png>) | Archivo `docker-compose.yml` y configuracion del servicio PostgreSQL. |
| [093718](<Captura de pantalla 2026-08-23 093718.png>) | Archivo `.env` y datos iniciales: usuario `postgres`, base `tecnogua` y puerto `5432`. |
| [093740](<Captura de pantalla 2026-08-23 093740.png>) | Arranque del contenedor, estado `healthy`, escucha en `0.0.0.0:5432` y consultas SQL. |
| [093835](<Captura de pantalla 2026-08-23 093835.png>) | Correccion del nombre de base: `tegnoagua` no existia y luego se conecto correctamente a `tecnogua`. |
| [093855](<Captura de pantalla 2026-08-23 093855.png>) | Consulta `ip a` que confirma la IP `172.21.205.26` para acceso remoto. |
| [094810](<Captura de pantalla 2026-08-23 094810.png>) | Respaldo generado: `backup_nombre_bd_20260823.sql`, con tamano observado de 724 bytes. |
