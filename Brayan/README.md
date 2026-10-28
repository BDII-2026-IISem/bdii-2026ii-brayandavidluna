# Documentacion General y Guia Paso a Paso: Proyecto 04 (ClimaTec)

**Asignatura:** Base de Datos II  
**Estudiante:** Brayan David Arévalo Luna  
**Docente:** Ing. Jaider Quintero M.  
**Periodo:** 2026-II  
**Repositorio GitHub:** [BDII-2026-IISem/bdii-2026ii-brayandavidluna](https://github.com/BDII-2026-IISem/bdii-2026ii-brayandavidluna)  

---

## Resumen del Proyecto

Este documento registra el proceso completo de arquitectura, aprovisionamiento, resolución de problemas de conexión, pruebas por interfaz gráfica (GUI), ejecuciones DML/DDL, procedimientos almacenados parametrizados, triggers de negocio y sincronización en control de versiones para la implementación del **Proyecto 04: ClimaTec - Servicio técnico de refrigeración**.

La solución integra un total de **16 tablas**:
1. **Subsistema Transversal RBAC (6 tablas):** `users`, `roles`, `role_users`, `resources`, `resource_roles`, `refresh_tokens`.
2. **Dominio de Negocio ClimaTec (10 tablas):** `cliente`, `equipo`, `tecnico`, `orden_servicio`, `diagnostico`, `repuesto`, `consumo_repuesto`, `cotizacion`, `pago`, `garantia`.

Los scripts mantienen las 16 tablas de ClimaTec; no incluyen el catálogo comercial ni las ventas de StoreLab. La tabla `repuesto` incorpora la columna `stock` para controlar existencias: el consumo queda relacionado con cada orden de servicio en `consumo_repuesto`. La tabla `pago` conserva su referencia original y añade relaciones opcionales a la orden de servicio y al usuario que registró el pago, para mostrar al cliente y al operador en el admin. La tabla `cliente` conserva el campo opcional `address`.

El sistema fue desplegado, manipulado e inspeccionado de manera transparente sobre **cuatro motores relacionales** en contenedores de Docker mediante WSL2 (Ubuntu).

---

## Entorno de Trabajo e Infraestructura

* **Sistema Operativo:** Windows con Subsystem para Linux (WSL2 / Ubuntu).
* **Virtualización:** Docker & Docker Compose en la red `ia-lab-network`.
* **Cliente de Administración:** DBeaver 26.2.1.
* **Motores Administrados:**
  * **MySQL 8.0:** Contenedor `mysql-server` | Puerto `3306` (`bd_clima_tec`)
  * **PostgreSQL 17:** Contenedor `postgres-server` | Puerto `5432` (`bd_clima_tec`)
  * **MS SQL Server 2022:** Contenedor `mssql-server` | Puerto `1433` (`bd_clima_tec`)
  * **Oracle Database 21c XE:** Contenedor `oracle-server` | Puerto `1521` (`BRAYAN` / `XEPDB1`)

---

## Estructura del Repositorio

```text
basededatos2/
├── Backend-2026/
│   └── Django/              # API REST de ClimaTec y sus aplicaciones
├── Frontend-2026/           # Interfaz del proyecto
├── Brayan/
│   ├── evidencias/          # Capturas por motor de base de datos
│   ├── scripts/             # DDL, DML y procedimientos por motor
│   ├── proceso.md           # Guía del trabajo de bases de datos
│   └── README.md            # Presentación y guía principal del proyecto
└── proceso1.md              # Documentación complementaria del despliegue

```

## Guía paso a paso del procedimiento realizado

### Paso 1: Estructuración del repositorio local en Ubuntu

Desde la terminal de Ubuntu en WSL2, se ingresó al directorio raíz del proyecto y se creó la jerarquía modular de directorios para los scripts SQL y las evidencias visuales:

```bash
cd /home/brayan/ia-lab/projecs/basededatos2/Brayan

# Creación de carpetas para scripts DDL/DML por motor
mkdir -p scripts/01-mysql scripts/02-postgresql scripts/03-sql-server scripts/04-oracle
mkdir -p scripts/01-mysql/consultas scripts/02-postgresql/consultas scripts/03-sql-server/consultas scripts/04-oracle/consultas

# Creación de carpetas para las imágenes de evidencia
mkdir -p evidencias/01-mysql evidencias/02-postgresql evidencias/03-sql-server evidencias/04-oracle
```

### Paso 2: Aprovisionamiento y ejecución por motor

1. Motor 1: MySQL 8.0 (01-mysql)
Configuración de Permisos en el Contenedor: Se asignaron privilegios globales al usuario local.

Ejecución DDL/DML, SPs Parametrizados y Triggers: Se compilaron las rutinas en MySQL redefiniendo los delimitadores (DELIMITER //).

Evidencias Visuales: Se registraron e ingresaron las pruebas de invocación en evidencias/01-mysql/.

2. Motor 2: PostgreSQL 17 (02-postgresql)
Creación del Esquema y Rutinas: Se crearon las funciones parametrizadas utilizando la cláusula nativa LANGUAGE sql y el trigger de auto-cierre en PL/pgSQL.

Evidencias Visuales: Se probaron con llamadas SELECT * FROM asociando las capturas 1.png a 5.png.

3. Motor 3: MS SQL Server 2022 (03-sql-server)
Implementación T-SQL: Se crearon procedimientos con sintaxis CREATE OR ALTER PROCEDURE y triggers de tipo AFTER UPDATE sobre las tablas del sistema inserted y deleted.

Evidencias Visuales: Se probaron con la sentencia EXEC asociando las capturas 1.png a 5.png.

4. Motor 4: Oracle Database 21c XE (04-oracle)
Implementación PL/SQL: Se crearon los procedimientos almacenados utilizando variables de cursor procedimental SYS_REFCURSOR y el paquete DBMS_SQL.RETURN_RESULT para imprimir grillas de datos dinámicas.

Trigger de Negocio: Disparador BEFORE UPDATE para el cálculo automático del campo fecha_cierre al actualizar a estado 'CERRADA'.

Evidencias Visuales: Invocaciones probadas en bloques BEGIN ... END; guardando las capturas 1.png a 5.png.
