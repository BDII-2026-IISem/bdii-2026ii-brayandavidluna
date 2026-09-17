# 📘 Documentación General y Guía Paso a Paso: Proyecto 04 (ClimaTec)

**Asignatura:** Base de Datos II  
**Estudiante:** Brayan David Arévalo Luna  
**Docente:** Ing. Jaider Quintero M.  
**Periodo:** 2026-II  
**Repositorio GitHub:** [BDII-2026-IISem/bdii-2026ii-brayandavidluna](https://github.com/BDII-2026-IISem/bdii-2026ii-brayandavidluna)  

---

##  Resumen del Proyecto

Este documento registra el proceso completo de arquitectura, aprovisionamiento, resolución de problemas de conexión, pruebas por interfaz gráfica (GUI) y sincronización en control de versiones para la implementación del **Proyecto 04: ClimaTec**.

La solución integra un total de **16 tablas**:
1. **Subsistema Transversal RBAC (6 tablas):** `users`, `roles`, `role_users`, `resources`, `resource_roles`, `refresh_tokens`.
2. **Dominio de Negocio ClimaTec (10 tablas):** `cliente`, `equipo`, `tecnico`, `orden_servicio`, `diagnostico`, `repuesto`, `consumo_repuesto`, `cotizacion`, `pago`, `garantia`.

El sistema fue desplegado y verificado de manera transparente sobre **cuatro motores relacionales** en contenedores de Docker mediante WSL2 (Ubuntu).

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

##  Guía Paso a Paso del Procedimiento Realizado

### Paso 1: Estructuración del Repositorio Local en Ubuntu

Desde la terminal de Ubuntu en WSL, se ingresó al directorio raíz del proyecto y se creó la jerarquía modular para organizar los scripts SQL y las evidencias de imagen:

```bash
cd /home/brayan/ia-lab/projecs/basededatos2/Brayan

# Creación de carpetas para scripts DDL/DML
mkdir -p scripts/01-mysql scripts/02-postgresql scripts/03-sql-server scripts/04-oracle

# Creación de carpetas para las imágenes de evidencia
mkdir -p evidencias/01-mysql evidencias/02-postgresql evidencias/03-sql-server evidencias/04-oracle
```

### Paso 2: Aprovisionamiento y Ejecución por Motor

#### 🟢 1. MySQL 8.0 (Motor 1)

**Configuración de Permisos en el Contenedor:**
Se ingresó a la consola interactiva de MySQL para garantizar privilegios de conexión remota sobre el usuario local:

```bash
docker exec -it mysql-server mysql -u root -p
```

Dentro de MySQL:

```sql
GRANT ALL PRIVILEGES ON *.* TO 'brayan'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
EXIT;
```

**Obtención de la Dirección IP de WSL:**
Se ejecutó `ip a` en la consola para obtener la IP de la interfaz eth0 (ej. `172.21.205.26`) utilizada por DBeaver.

**Ejecución DDL y Pruebas:**

- Se creó y guardó el archivo `scripts/01-mysql/01_ddl_dml_climatec.sql`.
- Se ejecutó el script completo en DBeaver usando `Alt + X`.
- Se guardaron las evidencias visuales (`01_ddl_tablas.png`, `02_gui_insercion.png`, `03_gui_insercion.png`) en `evidencias/01-mysql/` y se redactó su `README.md`.

#### 🔵 2. PostgreSQL 17 (Motor 2)

**Ajuste del Script DDL:**
Se estructuró el archivo `scripts/02-postgresql/02_ddl_dml_climatec.sql` adaptando la sintaxis a dialecto PostgreSQL (BIGSERIAL / IDENTITY).

**Ejecución y Persistencia:**

- Se estableció conexión desde DBeaver sobre el puerto 5432 en el esquema `public`.
- Se corrieron los comandos DDL mediante `Alt + X` y se realizaron inserciones en la tabla `cliente`.
- Se movieron las capturas a `evidencias/02-postgresql/` y se actualizó su `README.md`.

#### 🟡 3. Microsoft SQL Server 2022 (Motor 3)

**Identificación de Credenciales de Administración:**
Para solucionar el bloqueo de autenticación `Login failed for user 'sa'`, se extrajo la clave del entorno inspeccionando el contenedor:

```bash
docker inspect mssql-server | grep -i "SA_PASSWORD"
# Clave identificada: MSSQL_SA_PASSWORD=Brayan2608*
```

**Solución al Contexto de Base de Datos:**

- Inicialmente se conectó DBeaver a la base de datos `master`.
- Se ejecutó el script T-SQL `scripts/03-sql-server/03_ddl_dml_climatec.sql` que crea automáticamente la base de datos `bd_clima_tec` y sus 16 tablas.

**Manejo de Autoincrementables (IDENTITY):**
Al probar la inserción manual GUI sobre la tabla `cliente`, se dejó la celda del campo `id` completamente vacía en DBeaver para no violar la restricción de inserción explícita de SQL Server. Se confirmó el cambio con `Ctrl + S`.

**Documentación:** Se registraron las capturas en `evidencias/03-sql-server/` y se actualizó el `README.md`.

#### 🔴 4. Oracle Database 21c XE (Motor 4)

**Resolución de Errores de Conexión (ORA-12514 / ORA-01045):**

- **ORA-12514:** Se solucionó configurando la conexión en DBeaver seleccionando Service Name con el valor `XEPDB1`.
- **ORA-01045:** Se resolvió el fallo de privilegios insuficientes conectándose como superusuario SYSDBA dentro del contenedor desde la terminal de Ubuntu:

```bash
docker exec -it oracle-server sqlplus / as sysdba
```

Comandos ejecutados dentro de Oracle (SQL>):

```sql
ALTER SESSION SET CONTAINER = XEPDB1;
GRANT CREATE SESSION, CREATE TABLE, CREATE SEQUENCE, CREATE TRIGGER TO BRAYAN;
ALTER USER BRAYAN QUOTA UNLIMITED ON USERS;
EXIT;
```

**Ejecución DDL / DML:**

- Se copió el script en `scripts/04-oracle/04_ddl_dml_climatec.sql` con sintaxis `NUMBER GENERATED ALWAYS AS IDENTITY`.
- Se ejecutó el archivo en DBeaver mediante `Alt + X` (Ejecutar Script).
- Se verificó que Oracle asignara nombres en mayúsculas por defecto (`CLIENTE`, `USERS`, `ORDEN_SERVICIO`).

**Prueba GUI:** Se insertó un registro en la grilla de la tabla `CLIENTE` dejando el ID en blanco y aplicando el Commit.

### Paso 3: Limpieza y Sincronización con Git / GitHub

**Revisión de Estado Local:**
En la raíz del proyecto `/home/brayan/ia-lab/projecs/basededatos2/Brayan`, se ejecutó `git status` verificando que los archivos viejos con espacios o caracteres no deseados estuvieran listos para ser saneados.

**Inclusión de Archivos y Limpieza de Trabajo:**

```bash
cd /home/brayan/ia-lab/projecs/basededatos2/Brayan

# Registrar todos los cambios, adiciones y eliminaciones de duplicados
git add -A

# Confirmar el commit con mensaje descriptivo
git commit -m "feat: DDL, DML y evidencias GUI completadas para Proyecto 04 ClimaTec en los 4 motores"

# Subir de forma definitiva al servidor remoto
git push origin main
```

---

##  Organización de Evidencias Guardadas

Las evidencias físicas se organizaron en el repositorio bajo este esquema estandarizado:
evidencias/
├── 01-mysql/
│ ├── 01_ddl_tablas.png # Muestra de las 16 tablas creadas
│ ├── 02_gui_insercion.png # Fila nueva resaltada en verde (modo borrador)
│ ├── 03_gui_insercion.png # Registro persistido tras guardar
│ └── README.md # Documentación del motor
├── 02-postgresql/
│ ├── 01_ddl_tablas.png
│ ├── 02_gui_insercion.png
│ ├── 03_gui_insercion.png
│ └── README.md
├── 03-sql-server/
│ ├── 01_ddl_tablas.png
│ ├── 02_gui_insercion.png
│ ├── 03_gui_insercion.png
│ └── README.md
└── 04-oracle/
├── 01_ddl_tablas.png
├── 02_gui_insercion.png
├── 03_gui_insercion.png
└── README.md

---

## Conclusión de la Actividad

Se logró de forma 100% exitosa la construcción, despliegue, aprovisionamiento de seguridad, inserción de datos por GUI y documentación de los 4 motores de bases de datos exigidos para el Proyecto 04: ClimaTec, asegurando almacenamiento persistente en Docker y trazabilidad total en GitHub.
