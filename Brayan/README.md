# 📘 Proyecto 04: ClimaTec - Servicio Técnico de Refrigeración

**Asignatura:** Base de Datos II  
**Estudiante:** Brayan David Arévalo Luna  
**Docente:** Ing. Jaider Quintero M.  
**Periodo:** 2026-II  
**Repositorio GitHub:** [BDII-2026-IISem/bdii-2026ii-brayandavidluna](https://github.com/BDII-2026-IISem/bdii-2026ii-brayandavidluna)  

---

## 📋 Resumen del Proyecto

Este repositorio documenta el diseño, aprovisionamiento, migración de esquemas, pruebas de interfaz gráfica (GUI) e implementación de **14 Procedimientos Almacenados (Stored Procedures)** sobre la base de datos relacional para el **Proyecto 04: ClimaTec** (Sistema de Gestión para Servicio Técnico de Refrigeración).

La solución abarca un total de **16 tablas**:
1. **Subsistema Transversal RBAC (6 tablas):** `users`, `roles`, `role_users`, `resources`, `resource_roles`, `refresh_tokens`.
2. **Dominio de Negocio ClimaTec (10 tablas):** `cliente`, `equipo`, `tecnico`, `orden_servicio`, `diagnostico`, `repuesto`, `consumo_repuesto`, `cotizacion`, `pago`, `garantia`.

Todo el entorno fue desplegado y verificado de manera transparente sobre **cuatro motores de bases de datos relacionales** ejecutándose en contenedores de Docker mediante WSL2 (Ubuntu).

---

## 🛠️ Entorno de Trabajo e Infraestructura

* **Sistema Operativo:** Windows 11 con Subsystem para Linux (WSL2 / Ubuntu).
* **Virtualización:** Docker & Docker Compose en la red `ia-lab-network`.
* **Cliente de Administración GUI:** DBeaver 26.2.1.
* **Motores Administrados:**
  * **MySQL 8.0:** Contenedor `mysql-server` | Puerto `3306` (`bd_clima_tec`)
  * **PostgreSQL 17:** Contenedor `postgres-server` | Puerto `5432` (`bd_clima_tec`)
  * **MS SQL Server 2022:** Contenedor `mssql-server` | Puerto `1433` (`bd_clima_tec`)
  * **Oracle Database 21c XE:** Contenedor `oracle-server` | Puerto `1521` (`BRAYAN` / `XEPDB1`)

---

## 🗂️ Estructura del Repositorio

```text
Brayan/
├── evidencias/
│   ├── 01-mysql/            # Capturas DDL/GUI/SP + README.md explicativo
│   ├── 02-postgresql/       # Capturas DDL/GUI/SP + README.md explicativo
│   ├── 03-sql-server/       # Capturas DDL/GUI/SP + README.md explicativo
│   └── 04-oracle/           # 14 Capturas de Stored Procedures + README.md
├── scripts/
│   ├── 01-mysql/            # 01_ddl_dml_climatec.sql, sp_climatec.sql
│   ├── 02-postgresql/       # 02_ddl_dml_climatec.sql, sp_climatec.sql
│   ├── 03-sql-server/       # 03_ddl_dml_climatec.sql, sp_climatec.sql
│   └── 04-oracle/           # 04_ddl_dml_climatec.sql, sp_climatec.sql
├── documentacion2.md        # Informe técnico base del entorno de infraestructura
└── README.md                # Guía y presentación principal del proyecto
⚙️ Fases de Desarrollo e Implementación
1. Definición DDL y Carga Inicial DML
Se crearon las estructuras en los cuatro motores adaptando los tipos de datos nativos para claves primarias autoincrementales, restricciones de integridad referencial (FOREIGN KEY) y valores por defecto (TIMESTAMP, CHECK constraints):

MySQL: AUTO_INCREMENT, ENGINE=InnoDB.

PostgreSQL: SERIAL / BIGSERIAL, esquema public.

SQL Server: Columnas IDENTITY(1,1) e instrucciones T-SQL.

Oracle XE: Tablas bajo el esquema de usuario BRAYAN dentro de la PDB XEPDB1.

2. Implementación de Procedimientos Almacenados (Stored Procedures)
Se implementaron 14 rutinas almacenadas en cada motor para cubrir las siguientes categorías de negocio:

Filtrado Básico y Condicional (WHERE): Búsquedas por Cédula (CC), estados combinados (OR), patrones (LIKE), rangos de fechas (BETWEEN), listas (IN) y valores nulos (IS NULL).

Ordenamiento (ORDER BY): Clasificación descendente de repuestos costosos.

Agregación y Agrupamiento (GROUP BY / HAVING): Conteo de órdenes por técnico y filtrado de alta productividad.

Combinaciones Multitabla (JOIN): Cruce entre clientes/equipos (INNER JOIN) y órdenes/diagnósticos (LEFT JOIN).

Subconsultas y Paginación: Selección de repuestos por encima del precio promedio y filtrado Top 3 (LIMIT / TOP / FETCH FIRST 3 ROWS ONLY).

Consulta Consolidada de Negocio: Reporte de inversión total en repuestos por cliente en órdenes cerradas.
