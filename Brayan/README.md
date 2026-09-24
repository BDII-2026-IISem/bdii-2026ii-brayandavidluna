# Documentacion General y Guia Paso a Paso: Proyecto 04 (ClimaTec)

**Asignatura:** Base de Datos II  
**Estudiante:** Brayan David Arévalo Luna  
**Docente:** Ing. Jaider Quintero M.  
**Periodo:** 2026-II  
**Repositorio GitHub:** [BDII-2026-IISem/bdii-2026ii-brayandavidluna](https://github.com/BDII-2026-IISem/bdii-2026ii-brayandavidluna)  

---

## Resumen del Proyecto

Este documento registra el proceso completo de arquitectura, aprovisionamiento, resolución de problemas de conexión, pruebas por interfaz gráfica (GUI), ejecuciones DML/DDL y sincronización en control de versiones para la implementación del **Proyecto 04: ClimaTec - Servicio técnico de refrigeración**.

La solución integra un total de **16 tablas**:
1. **Subsistema Transversal RBAC (6 tablas):** `users`, `roles`, `role_users`, `resources`, `resource_roles`, `refresh_tokens`.
2. **Dominio de Negocio ClimaTec (10 tablas):** `cliente`, `equipo`, `tecnico`, `orden_servicio`, `diagnostico`, `repuesto`, `consumo_repuesto`, `cotizacion`, `pago`, `garantia`.

El sistema fue desplegado, manipulado e inspeccionado de manera transparente sobre **cuatro motores relacionales** en contenedores de Docker mediante WSL2 (Ubuntu).

---

## Entorno de Trabajo e Infraestructura

* **Sistema Operativo:** Windows con Subsystem para Linux (WSL2 / Ubuntu).
* **Virtualización:** Docker & Docker Compose en la red `ia-lab-network`.
* **Cliente de Administración:** DBeaver 26.1.5.
* **Motores Administrados:**
  * **MySQL 8.0:** Contenedor `mysql-server` | Puerto `3306`
  * **PostgreSQL 17:** Contenedor `postgres-server` | Puerto `5432`
  * **MS SQL Server 2022:** Contenedor `mssql-server` | Puerto `1433`
  * **Oracle Database 21c XE:** Contenedor `oracle-server` | Puerto `1521`

---

## Guia Paso a Paso del Procedimiento Realizado

### Paso 1: Estructuración del Repositorio Local en Ubuntu

Desde la terminal de Ubuntu en WSL2, se ingresó al directorio raíz del proyecto y se creó la jerarquía modular de directorios para los scripts SQL y las evidencias visuales:

```bash
cd /home/brayan/ia-lab/projecs/basededatos2/Brayan

# Creación de carpetas para scripts DDL/DML por motor
mkdir -p scripts/01-mysql scripts/02-postgresql scripts/03-sql-server scripts/04-oracle
mkdir -p scripts/01-mysql/consultas scripts/02-postgresql/consultas scripts/03-sql-server/consultas scripts/04-oracle/consultas

# Creación de carpetas para las imágenes de evidencia
mkdir -p evidencias/01-mysql evidencias/02-postgresql evidencias/03-sql-server evidencias/04-oracle
Paso 2: Aprovisionamiento y Ejecución por Motor
1. Motor 1: MySQL 8.0 (01-mysql)
Configuración de Permisos en el Contenedor: Se asignaron privilegios globales al usuario brayan:

Bash
docker exec -it mysql-server mysql -u root -p
SQL
GRANT ALL PRIVILEGES ON *.* TO 'brayan'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
EXIT;
Ejecución DDL/DML y Consultas: Se creó la base de datos bd_clima_tec, se poblaron las entidades del dominio y se diseñaron los reportes de consulta avanzados DML.

Pruebas GUI: Inserción manual en la entidad cliente guardada con Ctrl + S.

2. Motor 2: PostgreSQL 17 (02-postgresql)
Poblamiento Adaptado DML: Se ejecutaron las inserciones DML respetando las secuencias reales de IDs autoincrementados (cliente_id: 3..7, equipo_id: 9..14, orden_servicio_id: 6..10).

Consultas Avanzadas (DML): Se diseñó el script consultas_climatec.sql abarcando consultas condicionales (WHERE), ordenamiento (ORDER BY), agrupaciones (GROUP BY / HAVING), combinaciones multitabla (INNER JOIN, LEFT JOIN), subconsultas y la consulta consolidada de negocio.

Evidencias Visuales: Captura individual en DBeaver de cada consulta en la grilla y almacenamiento ordenado en evidencias/02-postgresql/ (archivos 01 a 17).

3. Motor 3: Microsoft SQL Server 2022 (03-sql-server)
Inspección de Credenciales sa:

Bash
docker inspect mssql-server | grep -i "SA_PASSWORD"
Ejecución DDL / DML: Creación de la base de datos bd_clima_tec dentro del esquema dbo mediante T-SQL (IDENTITY(1,1)).

Prueba GUI y Consultas DML: Ejecución del conjunto de pruebas DML (TOP 3, GROUP BY, JOINs) recopiladas y catalogadas del 01 al 17 en evidencias/03-sql-server/.

4. Motor 4: Oracle Database 21c Express Edition (04-oracle)
Configuración de Usuario y Privilegios:

Bash
docker exec -it oracle-server sqlplus / as sysdba
SQL
ALTER SESSION SET CONTAINER = XEPDB1;
GRANT CREATE SESSION, CREATE TABLE, CREATE SEQUENCE, CREATE TRIGGER TO BRAYAN;
ALTER USER BRAYAN QUOTA UNLIMITED ON USERS;
EXIT;
Ejecución DDL / DML: Despliegue de estructuras PL/SQL en el esquema BRAYAN utilizando NUMBER GENERATED ALWAYS AS IDENTITY, ejecuciones DML/consultas (FETCH FIRST 3 ROWS ONLY) y confirmación explícita de transacciones mediante COMMIT.

Paso 3: Organización de Evidencias Fotográficas
Dentro de cada subcarpeta en evidencias/, se organizaron las capturas requeridas por la guía:

Estructura Base DDL / GUI: 01_ddl_tablas.png, 02_gui_insercion.png, 03_gui_insercion.png.

Reportes DML (MySQL / PostgreSQL / SQL Server / Oracle): Capturas ordenadas secuencialmente del 04 al 17 registrando las grillas de resultados en DBeaver para cada tipo de consulta SQL ejecutada en los motores.

Paso 4: Sincronización y Push a GitHub
Actualización de los cambios mediante comandos de control de versiones Git desde la consola de Ubuntu:

Bash
cd /home/brayan/ia-lab/projecs/basededatos2/Brayan

# Rastrear todos los archivos modificados y nuevos
git add -A

# Confirmar cambios con mensaje estandarizado
git commit -m "docs: documentacion general limpia DDL, DML y consultas para ClimaTec en los 4 motores"

# Subir a la rama principal de GitHub
git push origin main
Estado Final de Entregables en el Repositorio
Plaintext
Brayan/
├── evidencias/
│   ├── 01-mysql/            # Capturas DDL/GUI + Capturas DML + README.md
│   ├── 02-postgresql/       # Capturas DDL/GUI + Capturas DML (01-17) + README.md
│   ├── 03-sql-server/       # Capturas DDL/GUI + Capturas DML (01-17) + README.md
│   └── 04-oracle/           # Capturas DDL/GUI + Capturas DML (01-17) + README.md
├── scripts/
│   ├── 01-mysql/            # 01_ddl_dml_climatec.sql + consultas/consultas_climatec.sql
│   ├── 02-postgresql/       # 02_ddl_dml_climatec.sql + consultas/consultas_climatec.sql
│   ├── 03-sql-server/       # 03_ddl_dml_climatec.sql + consultas/consultas_climatec.sql
│   └── 04-oracle/           # 04_ddl_dml_climatec.sql + consultas/consultas_climatec.sql
├── documentacion2.md        # Bitácora detallada de comandos de infraestructura
└── README.md                # Presentación general e informe integrador
Conclusión
Se completó de manera 100% exitosa la construcción, población, ejecución de consultas avanzadas, prueba gráfica y documentación de la base de datos del Proyecto 04: ClimaTec a lo largo de los cuatro motores solicitados (MySQL, PostgreSQL, SQL Server y Oracle XE), manteniendo sincronización total con el repositorio en GitHub.
