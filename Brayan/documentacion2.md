# Implementacion de cuatro motores de bases de datos con Docker Compose

## 1. Objetivo

Se desplegaron cuatro motores de bases de datos dentro de WSL mediante Docker Compose:

- MySQL 8.0
- PostgreSQL 17
- Microsoft SQL Server 2022
- Oracle Database 21c Express Edition

El objetivo fue dejar los servicios disponibles localmente y permitir su administracion remota desde DBeaver.

## 2. Entorno utilizado

- Equipo: `LAPTOP-2KBTPDGN`
- Usuario de WSL: `brayan`
- Direccion IPv4 observada en `eth0`: `172.21.205.26`
- Zona horaria configurada: `America/Bogota`
- Herramienta grafica: DBeaver 26.1.5
- Plataforma: WSL2, Ubuntu y Docker Compose

La direccion `172.21.205.26` fue confirmada con `ip a` en las capturas de MySQL, PostgreSQL, SQL Server y Oracle. Esta IP puede cambiar al reiniciar WSL, por lo que debe comprobarse nuevamente antes de una conexion remota.

## 3. Preparacion comun

La guia propone crear una estructura separada para los archivos de configuracion y los datos persistentes:

```bash
mkdir -p ~/ia-lab/services/motores-bd/{mysql,postgres,mssql,oracle}
mkdir -p ~/ia-lab/data/{mysql,postgres,mssql,oracle}
```

Tambien se utiliza una red Docker compartida:

```bash
docker network inspect ia-lab-network >/dev/null 2>&1 || \
docker network create ia-lab-network
docker network ls | grep ia-lab
```

La persistencia se consigue montando una carpeta de `~/ia-lab/data` dentro de cada contenedor. Los respaldos se guardan en `/mnt/d/academia/bd`, que se puede consultar desde Windows.

## 4. MySQL 8.0

### 4.1 Configuracion

La configuracion utilizada por la guia crea el contenedor `mysql-server`, publica el puerto `3306` y habilita conexiones remotas:

```yaml
services:
	mysql:
		image: mysql:8.0
		container_name: mysql-server
		restart: unless-stopped
		env_file:
			- .env
		ports:
			- "3306:3306"
		volumes:
			- ../../../data/mysql:/var/lib/mysql
			- /mnt/d/academia/bd:/backups
		command: >
			--character-set-server=utf8mb4
			--collation-server=utf8mb4_unicode_ci
			--bind-address=0.0.0.0
		networks:
			- ia-lab-network

networks:
	ia-lab-network:
		external: true
```

Archivo `.env` de referencia:

```dotenv
TZ=America/Bogota
MYSQL_ROOT_PASSWORD=MiNiCo57**
MYSQL_DATABASE=tecnogua
```

Se habilito el puerto en el firewall:

```bash
sudo ufw allow 3306/tcp
sudo ufw enable
sudo ufw status
```

### 4.2 Arranque y comprobacion

```bash
cd ~/ia-lab/services/motores-bd/mysql
sudo docker compose up -d
sudo docker ps | grep mysql-server
sudo docker logs mysql-server --tail 20
```

La evidencia de DBeaver muestra una conexion MySQL activa en `172.21.205.26:3306`. La base que aparece en el arbol de DBeaver es `mi_nueva_bd`.

Conexion local:

```bash
sudo docker exec -it mysql-server mysql -u root -p
```

Dentro del monitor se comprobo MySQL Community Server `8.0.46`.

### 4.3 Usuario y permisos

La primera ejecucion de `GRANT` fallo porque se ejecuto fuera del monitor de MySQL. Al entrar correctamente como `root`, las sentencias terminaron con `Query OK`:

```sql
CREATE DATABASE mi_nueva_bd
	CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'brayan'@'%' IDENTIFIED BY 'Brayan2608';
GRANT ALL PRIVILEGES ON mi_nueva_bd.* TO 'brayan'@'%';
FLUSH PRIVILEGES;
```

La cuenta `'brayan'@'%'` permite la conexion desde otros equipos. Para una instalacion real conviene limitar el origen en lugar de usar `%` y cambiar las contrasenas de ejemplo.

### 4.4 Respaldo

La guia utiliza `mysqldump` para generar un archivo SQL:

```bash
sudo docker exec mysql-server mysqldump -u root -pMiNiCo57** mi_nueva_bd \
	> /mnt/d/academia/bd/backup_mi_nueva_bd_$(date +%Y%m%d).sql
```

La captura muestra el archivo `backup_mi_nueva_bd_20260821.sql` dentro del volumen de respaldos.

## 5. PostgreSQL 17

### 5.1 Configuracion y arranque

Se utilizo el contenedor `postgres-server`, el puerto `5432`, almacenamiento persistente y escucha en todas las interfaces:

```yaml
services:
	postgres:
		image: postgres:17
		container_name: postgres-server
		restart: unless-stopped
		env_file:
			- .env
		ports:
			- "5432:5432"
		volumes:
			- ../../../data/postgres:/var/lib/postgresql/data
			- /mnt/d/academia/bd:/backups
		command: ["postgres", "-c", "listen_addresses=*"]
		networks:
			- ia-lab-network
```

Archivo `.env`:

```dotenv
TZ=America/Bogota
POSTGRES_USER=postgres
POSTGRES_PASSWORD=MiNiCo57**
POSTGRES_DB=tecnogua
```

```bash
sudo ufw allow 5432/tcp
cd ~/ia-lab/services/motores-bd/postgres
sudo docker compose up -d
sudo docker ps | grep postgres-server
sudo docker logs postgres-server --tail 20
```

Los logs reales indican PostgreSQL `17.11`, escucha en `0.0.0.0` y `::` por el puerto `5432`; el contenedor aparece como `healthy`.

### 5.2 Bases de datos y usuario

La conexion local se realizo con:

```bash
sudo docker exec -it postgres-server psql -U postgres -d tecnogua
```

En la prueba se creo `bd_clase1` y se verifico el listado con `\l`. La salida mostro `bd_clase1`, `postgres`, `tecnogua`, `template0` y `template1`.

Tambien se creo la base que aparece en DBeaver como `nombre_bd`, junto con el usuario personal:

```sql
CREATE DATABASE nombre_bd;
CREATE USER Brayan WITH PASSWORD 'Say260805';
GRANT ALL PRIVILEGES ON DATABASE nombre_bd TO Brayan;
ALTER DATABASE nombre_bd OWNER TO Brayan;
```

Una prueba inicial intento conectarse a `tegnoagua`, que no existia. La conexion correcta fue a `tecnogua`. Esto confirma que el nombre debe escribirse exactamente.

### 5.3 Conexion remota y respaldo

En DBeaver se comprobo la conexion `nombre_bd` mediante `172.21.205.26:5432`.

Respaldo ejecutado:

```bash
sudo docker exec postgres-server pg_dump -U postgres -d nombre_bd \
	> ~/backup_nombre_bd_$(date +%Y%m%d).sql
ls -lh ~/backup_nombre_bd_*.sql
```

La evidencia muestra `backup_nombre_bd_20260823.sql` con un tamano de `724` bytes.

## 6. Microsoft SQL Server 2022

### 6.1 Configuracion y arranque

Se utilizo la imagen oficial `mcr.microsoft.com/mssql/server:2022-latest`, el contenedor `mssql-server` y el puerto `1433`.

```yaml
services:
	mssql:
		image: mcr.microsoft.com/mssql/server:2022-latest
		container_name: mssql-server
		restart: unless-stopped
		user: root
		env_file:
			- .env
		ports:
			- "0.0.0.0:1433:1433"
		volumes:
			- ../../../data/mssql:/var/opt/mssql
			- /mnt/d/academia/bd:/backups
		networks:
			- ia-lab-network
```

Archivo `.env`:

```dotenv
TZ=America/Bogota
ACCEPT_EULA=Y
MSSQL_SA_PASSWORD=MiNiCo57**
MSSQL_PID=Developer
```

```bash
sudo ufw allow 1433/tcp
cd ~/ia-lab/services/motores-bd/mssql
sudo docker compose up -d
sudo docker ps | grep mssql-server
sudo docker logs mssql-server --tail 20
```

La evidencia confirma que `mssql-server` quedo `Up` y `healthy`, con `0.0.0.0:1433->1433/tcp`.

### 6.2 Herramientas y pruebas SQL

En Ubuntu 24.04 se instalaron `mssql-tools18` y `unixodbc-dev` desde el repositorio oficial de Microsoft:

```bash
sudo apt update && sudo apt install -y curl ca-certificates gnupg
sudo rm -f /etc/apt/sources.list.d/mssql-release.list
sudo rm -f /etc/apt/sources.list.d/microsoft-prod.list
cd /tmp
curl -sSL -O https://packages.microsoft.com/config/ubuntu/24.04/packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt update
sudo ACCEPT_EULA=Y apt install -y mssql-tools18 unixodbc-dev
echo 'export PATH="$PATH:/opt/mssql-tools18/bin"' >> ~/.bashrc
source ~/.bashrc
which sqlcmd
```

La salida verificada fue `/opt/mssql-tools18/bin/sqlcmd`.

Con `sqlcmd` se creo `bd_clase1`, y el listado real devolvio `master`, `tempdb`, `model`, `msdb` y `bd_clase1`.

Tambien se habilito el login `admin` y se verifico que no estuviera deshabilitado:

```sql
CREATE LOGIN admin WITH PASSWORD = '123456', CHECK_POLICY = OFF;
ALTER SERVER ROLE sysadmin ADD MEMBER admin;
ALTER LOGIN admin ENABLE;
SELECT name, is_disabled
FROM sys.server_principals
WHERE name = 'admin';
```

El resultado observado fue `admin` con `is_disabled = 0`.

### 6.3 Respaldo

Se respaldo `bd_clase1` en formato `.bak`:

```bash
sudo docker exec mssql-server /opt/mssql-tools18/bin/sqlcmd \
	-S localhost -U SA -P 'Brayan2608*' -C \
	-Q "BACKUP DATABASE [bd_clase1] TO DISK = N'/backups/backup_bd_clase1.bak' WITH INIT"
sudo docker exec mssql-server ls -lh /backups
```

La salida indico `BACKUP DATABASE successfully processed 346 pages`, y el archivo `backup_bd_clase1.bak` quedo con un tamano aproximado de `2.9M`.

## 7. Oracle Database 21c XE

### 7.1 Configuracion y arranque

Se utilizo `gvenzl/oracle-xe:21-slim`, el contenedor `oracle-server` y el puerto `1521`:

```yaml
services:
	oracle:
		image: gvenzl/oracle-xe:21-slim
		container_name: oracle-server
		restart: unless-stopped
		env_file:
			- .env
		ports:
			- "0.0.0.0:1521:1521"
		volumes:
			- ../../../data/oracle:/opt/oracle/oradata
			- /mnt/d/academia/bd:/backups
		networks:
			- ia-lab-network
		healthcheck:
			test: ["CMD", "healthcheck.sh"]
			interval: 10s
			timeout: 5s
			retries: 10
			start_period: 120s
```

Archivo `.env`:

```dotenv
TZ=America/Bogota
ORACLE_PASSWORD=MiNiCo57**
ORACLE_DATABASE=tecnogua
```

```bash
sudo ufw allow 1521/tcp
cd ~/ia-lab/services/motores-bd/oracle
sudo docker compose up -d
sudo docker ps | grep oracle-server
sudo docker logs oracle-server --tail 20
```

En el primer arranque aparecieron errores porque el volumen de datos no contenia las carpetas de Oracle (`XE/XEPDB1`, `XE/pdbseed`, entre otras), y el contenedor entro en reinicio. Tras corregir la inicializacion del volumen, Oracle quedo operativo.

### 7.2 Usuarios, conexion y respaldo

La conexion local se comprobo con Oracle Database 21c Express Edition, version `21.3.0.0.0`:

```bash
docker exec -it oracle-server bash
sqlplus sys/Brayan2608 as sysdba
```

Se creo el usuario personal `BRAYAN` y la consulta devolvio el usuario correctamente:

```sql
CREATE USER Brayan IDENTIFIED BY "Brayan2608"
	DEFAULT TABLESPACE USERS QUOTA UNLIMITED ON USERS;
ALTER USER Brayan QUOTA UNLIMITED ON USERS;
GRANT CONNECT, RESOURCE TO Brayan;
SELECT username FROM all_users WHERE username = 'BRAYAN';
CONN Brayan/"Brayan2608"
SELECT table_name FROM user_tables;
EXIT;
```

La salida mostro `BRAYAN`, la conexion fue exitosa y `user_tables` no devolvio filas porque el esquema aun no tenia tablas.

En DBeaver se observo la conexion Oracle `tecnogua` en `172.21.205.26:1521`. En este motor, `tecnogua` es el PDB o Service Name; el usuario administrativo es `SYSTEM`.

El primer comando de exportacion fallo con `ORA-12154` al usar un identificador de conexion incompleto. Se corrigio usando el descriptor completo:

```bash
sudo docker exec oracle-server expdp \
	'system/Brayan2608@//localhost:1521/tecnogua' \
	directory=DATA_PUMP_DIR \
	dumpfile=backup_tecnogua.dmp \
	logfile=backup_tecnogua.log
```

La exportacion corregida termino con `Job ... successfully completed` y creo `backup_tecnogua.dmp` con un tamano de `304K`.

## 8. Resumen de conexiones remotas

| Motor | Host | Puerto | Base o servicio observado | Usuario usado |
|---|---|---:|---|---|
| MySQL | `172.21.205.26` | 3306 | `mi_nueva_bd` | `root` / `brayan` |
| PostgreSQL | `172.21.205.26` | 5432 | `nombre_bd` | `postgres` / `Brayan` |
| SQL Server | `172.21.205.26` | 1433 | `master` / `bd_clase1` | `SA` / `admin` |
| Oracle | `172.21.205.26` | 1521 | Service Name `tecnogua` | `SYSTEM` / `BRAYAN` |

En DBeaver se verificaron las cuatro conexiones. Para SQL Server se debe activar la autenticacion SQL y confiar en el certificado del servidor cuando el controlador lo solicite. Para Oracle se debe seleccionar `tecnogua` como Service Name, no como SID `XE`.

## 9. Evidencias seleccionadas

Las capturas fueron copiadas y organizadas en la carpeta [evidencias](evidencias/README.md), sin eliminar los archivos originales de `C:\Users\Brayan\OneDrive\Imágenes\Screenshots`. Se omitieron duplicados y pantallas intermedias que no agregaban una comprobacion nueva.

- [Evidencias de MySQL](evidencias/01-mysql/)
- [Evidencias de PostgreSQL](evidencias/02-postgresql/)
- [Evidencias de SQL Server](evidencias/03-sql-server/)
- [Evidencias de Oracle](evidencias/04-oracle/)

- `Captura de pantalla 2026-08-21 143730.png` y `Captura de pantalla 2026-08-21 145634.png`: pruebas de conexion y permisos de MySQL.
- `Captura de pantalla 2026-08-23 093718.png`: configuracion de PostgreSQL y archivo `.env`.
- `Captura de pantalla 2026-08-23 093740.png`: arranque, estado saludable y consultas de PostgreSQL.
- `Captura de pantalla 2026-08-23 091719.png`: listado de bases de datos PostgreSQL.
- `Captura de pantalla 2026-08-23 094810.png`: respaldo `backup_nombre_bd_20260823.sql`.
- `Captura de pantalla 2026-08-24 182023.png`: arranque saludable de SQL Server.
- `Captura de pantalla 2026-08-25 025706.png` y `Captura de pantalla 2026-08-25 025631.png`: instalacion de `mssql-tools18` y verificacion de `sqlcmd`.
- `Captura de pantalla 2026-08-25 025730.png`: respaldo exitoso de `bd_clase1`.
- `Captura de pantalla 2026-08-25 205358.png`: configuracion de Oracle y diagnostico del primer arranque.
- `Captura de pantalla 2026-08-25 211214.png`: creacion y conexion del usuario Oracle `BRAYAN`.
- `Captura de pantalla 2026-08-25 211300.png`: exportacion Oracle exitosa y archivo `.dmp`.
- `Captura de pantalla 2026-08-25 213721.png`: conexiones remotas de los motores en DBeaver.

## 10. Fuentes consultadas

- [Introduccion y requisitos](https://tecnogua.com/academic/site/bd/introduccion/)
- [Instalacion de MySQL](https://tecnogua.com/academic/site/bd/instalacion/mysql/)
- [Instalacion de PostgreSQL](https://tecnogua.com/academic/site/bd/instalacion/postgresql/)
- [Instalacion de Microsoft SQL Server](https://tecnogua.com/academic/site/bd/instalacion/mssql/)
- [Instalacion de Oracle XE](https://tecnogua.com/academic/site/bd/instalacion/oracle/)

## 11. Recomendaciones

1. Cambiar las contrasenas de ejemplo antes de exponer los servicios fuera de una red de pruebas.
2. Evitar `GRANT ... ON *.*` y el uso de usuarios administradores para aplicaciones.
3. Restringir UFW a las IP necesarias en lugar de permitir los puertos desde `Anywhere`.
4. Confirmar la IP de WSL con `ip a` cada vez que se necesite una conexion remota.
5. Verificar periodicamente que los archivos de respaldo puedan restaurarse.

---

## Información del trabajo

**Estudiante:** Brayan David Arvealo Luna

**Docente:** Ing. Jaider Quintero M.

**Asignatura:** Base de Datos II

**Guia:** Oscar David Vega Daza

### Uso de Inteligencia Artificial

Durante el desarrollo de este trabajo se contó con el apoyo de **ChatGPT como herramienta de Inteligencia Artificial**, principalmente para solucionar los diferentes errores que se fueron presentando durante el proceso de montaje y configuración de los motores de bases de datos.

La herramienta fue de gran ayuda para identificar y corregir errores, desde situaciones como ejecutar comandos fuera del motor correspondiente, hasta errores de sintaxis y comandos utilizados durante la instalación y configuración. Mediante este proceso de trabajo conjunto fue posible solucionar las dificultades encontradas y lograr satisfactoriamente el **montaje y funcionamiento de los cuatro motores de bases de datos**.

### Experiencia

La experiencia durante el desarrollo de este trabajo fue **muy agradable y enriquecedora**, ya que permitió adquirir nuevos conocimientos sobre la instalación, configuración y manejo de diferentes motores de bases de datos. Además, el proceso de solucionar los errores que fueron apareciendo permitió comprender mejor el funcionamiento de las herramientas y fortalecer los conocimientos adquiridos en la asignatura.



