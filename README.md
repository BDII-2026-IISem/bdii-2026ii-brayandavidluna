# ClimaTec — Base de Datos II

Proyecto académico para diseñar, implementar y documentar una base de datos para **ClimaTec**, un servicio técnico de refrigeración. El repositorio reúne el modelo relacional, scripts para cuatro motores, una API Django con autorización RBAC y un frontend Angular.

| Dato | Información |
| --- | --- |
| Estudiante | Brayan David Arévalo Luna |
| Docente | Ing. Jaider Quintero M. |
| Asignatura | Base de Datos II |
| Periodo | 2026-II |
| Repositorio | [BDII-2026-IISem/bdii-2026ii-brayandavidluna](https://github.com/BDII-2026-IISem/bdii-2026ii-brayandavidluna) |

## Contenido

- [Alcance y modelo de datos](#alcance-y-modelo-de-datos)
- [Estructura](#estructura)
- [Bases de datos y scripts SQL](#bases-de-datos-y-scripts-sql)
- [Despliegue de los motores](#despliegue-de-los-motores)
- [Backend Django](#backend-django)
- [Frontend Angular](#frontend-angular)
- [ISS y validaciones](#iss-y-validaciones)
- [Evidencias](#evidencias)
- [Seguridad y recomendaciones](#seguridad-y-recomendaciones)
- [Referencias](#referencias)

## Alcance y modelo de datos

El dominio es **servicio técnico de refrigeración**, no una tienda. La guía académica de Django usa StoreLab como ejemplo; ClimaTec conserva su propio modelo y no incorpora el catálogo comercial `ProductType/Product` ni las ventas `Sale/ProductSale`.

El esquema contiene **16 tablas**:

| Área | Tablas |
| --- | --- |
| Servicio técnico (10) | `cliente`, `equipo`, `tecnico`, `orden_servicio`, `diagnostico`, `repuesto`, `consumo_repuesto`, `cotizacion`, `pago`, `garantia` |
| Usuarios y RBAC (6) | `users`, `roles`, `role_users`, `resources`, `resource_roles`, `refresh_tokens` |

Un cliente puede tener equipos y órdenes; cada equipo pertenece a un cliente y una orden se asigna a un técnico. Una orden agrupa diagnósticos, consumos de repuestos, cotizaciones, pagos y una garantía. El inventario registra el saldo en `repuesto.stock`; `consumo_repuesto` descuenta unidades asociadas a una reparación. Los pagos registran el dinero recibido, no el consumo físico de una pieza.

El modelo conserva `cliente.address` y añade el vínculo opcional de una cuenta a un cliente. También mantiene relaciones de pago con la orden y con quien lo registró. Los saldos de inventario preexistentes se inicializaron en cero porque no había un saldo histórico confiable; debe ingresarse el inventario físico real antes de registrar consumos nuevos. Las antiguas aplicaciones comerciales de StoreLab fueron retiradas; una migración elimina sus tablas anteriores.

## Estructura

```text
basededatos2/
├── README.md                         # Documentación única y vista previa del proyecto
├── Backend-2026/Django/              # API Django, aplicaciones, pruebas y evidencia
├── Frontend-2026/Django/             # Aplicación Angular, pruebas y evidencia
└── Brayan/
    ├── scripts/
    │   ├── 01-mysql/
    │   ├── 02-postgresql/
    │   ├── 03-sql-server/
    │   └── 04-oracle/
    └── evidencias/                   # Capturas por motor
```

La documentación de procesos y los README secundarios se consolidaron en este archivo para que GitHub muestre toda la guía del proyecto desde la raíz. Las capturas, scripts, código y archivos de configuración permanecen en sus carpetas originales.

## Bases de datos y scripts SQL

Los scripts crean el esquema y datos de ClimaTec, realizan consultas y prueban rutinas adaptadas a cada dialecto:

| Motor | Versión | Contenedor habitual | Puerto | Script |
| --- | --- | --- | ---: | --- |
| MySQL | 8.0 | `mysql-server` | 3306 | [`01_ddl_dml_climatec.sql`](./Brayan/scripts/01-mysql/01_ddl_dml_climatec.sql) |
| PostgreSQL | 17 | `postgres-server` | 5432 | [`02_ddl_dml_climatec.sql`](./Brayan/scripts/02-postgresql/02_ddl_dml_climatec.sql) |
| Microsoft SQL Server | 2022 | `mssql-server` | 1433 | [`03_ddl_dml_climatec.sql`](./Brayan/scripts/03-sql-server/03_ddl_dml_climatec.sql) |
| Oracle Database XE | 21c | `oracle-server` | 1521 | [`04_ddl_dml_climatec.sql`](./Brayan/scripts/04-oracle/04_ddl_dml_climatec.sql) |

Las versiones específicas de scripts de consultas están dentro de la carpeta `consultas` de cada motor. Se usan las construcciones propias de cada motor: `BIGSERIAL`/identidad en PostgreSQL, `IDENTITY` y T-SQL en SQL Server, e identidad y PL/SQL en Oracle.

### Consultas, procedimientos y triggers

Las pruebas abarcan filtros `WHERE`, `OR`, `LIKE`/`ILIKE`, `BETWEEN`, `IN`, `IS NULL`, ordenamiento, `GROUP BY`, `HAVING`, `INNER JOIN`, `LEFT JOIN`, subconsultas, paginación y reportes del negocio.

- **MySQL:** 14 procedimientos: `sp_obtener_clientes_cc`, `sp_obtener_ordenes_cerradas_reparacion`, `sp_buscar_repuesto_compresor`, `sp_obtener_ordenes_agosto_2026`, `sp_obtener_tecnicos_especificos`, `sp_obtener_ordenes_sin_cerrar`, `sp_obtener_repuestos_mas_caros`, `sp_conteo_ordenes_por_tecnico`, `sp_tecnicos_mas_de_una_orden`, `sp_obtener_clientes_con_equipos`, `sp_obtener_ordenes_con_diagnostico`, `sp_repuestos_sobre_promedio`, `sp_top_3_repuestos_costosos` y `sp_reporte_inversion_repuestos_cliente`.
- **PostgreSQL, SQL Server y Oracle:** procedimientos o funciones parametrizadas para buscar clientes por tipo de documento, repuestos por nombre, órdenes por rango de fechas y estado, técnicos con un mínimo de órdenes y reportes de inversión por cliente.
- **Triggers de cierre:** las implementaciones de los motores asignan la fecha de cierre de una orden cuando su estado cambia a `CERRADA`, usando la sintaxis propia de cada dialecto.

### Scripts SQL completos

Los bloques siguientes contienen los 12 scripts ejecutables del proyecto: esquema y datos iniciales, consultas y rutinas para cada motor. Se muestran contraídos para facilitar la lectura en GitHub. Los archivos `.sql` originales se conservan en `Brayan/scripts/` para ejecutar y editar cada dialecto.

#### MySQL 8.0

<details>
<summary>Esquema y datos iniciales ? <code>Brayan/scripts/01-mysql/01_ddl_dml_climatec.sql</code></summary>

```sql
-- Base de datos para Proyecto 04: ClimaTec (MySQL)
CREATE DATABASE IF NOT EXISTS bd_clima_tec;
USE bd_clima_tec;

-- ==========================================
-- 1. SUBSISTEMA RBAC (Transversal)
-- ==========================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_active ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    avatar VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    is_active ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE role_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    user_id INT NOT NULL,
    is_active ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    CONSTRAINT fk_ru_role FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT fk_ru_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT uq_role_user UNIQUE (role_id, user_id)
);

CREATE TABLE resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    path VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    is_active ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    CONSTRAINT uq_path_method UNIQUE (path, method)
);

CREATE TABLE resource_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resource_id INT NOT NULL,
    role_id INT NOT NULL,
    is_active ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    CONSTRAINT fk_rr_resource FOREIGN KEY (resource_id) REFERENCES resources(id),
    CONSTRAINT fk_rr_role FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT uq_resource_role UNIQUE (resource_id, role_id)
);

CREATE TABLE refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    device_info VARCHAR(255) NOT NULL,
    is_valid ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ==========================================
-- 2. DOMINIO CLIMATECT (Servicio Técnico)
-- ==========================================
CREATE TABLE cliente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_documento VARCHAR(20) NOT NULL,
    numero_documento VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(30) NOT NULL,
    email VARCHAR(150) NOT NULL,
    address VARCHAR(255) NULL,
    is_active ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE equipo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT NULL,
    is_active ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_equipo_cliente FOREIGN KEY (cliente_id) REFERENCES cliente(id)
);

CREATE TABLE tecnico (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion VARCHAR(255) NULL,
    is_active ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE orden_servicio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    equipo_id INT NOT NULL,
    tecnico_id INT NOT NULL,
    numero VARCHAR(50) NOT NULL UNIQUE,
    fecha_apertura DATETIME NOT NULL,
    fecha_cierre DATETIME NULL,
    total DECIMAL(12,2) DEFAULT 0.00,
    estado ENUM('ABIERTA', 'DIAGNOSTICO', 'COTIZADA', 'APROBADA', 'REPARACION', 'CERRADA', 'CANCELADA') DEFAULT 'ABIERTA',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_os_cliente FOREIGN KEY (cliente_id) REFERENCES cliente(id),
    CONSTRAINT fk_os_equipo FOREIGN KEY (equipo_id) REFERENCES equipo(id),
    CONSTRAINT fk_os_tecnico FOREIGN KEY (tecnico_id) REFERENCES tecnico(id)
);

CREATE TABLE diagnostico (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orden_servicio_id INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    is_active ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_diag_os FOREIGN KEY (orden_servicio_id) REFERENCES orden_servicio(id)
);

CREATE TABLE repuesto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NULL,
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    is_active ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE consumo_repuesto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orden_servicio_id INT NOT NULL,
    repuesto_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL,
    is_active ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cr_os FOREIGN KEY (orden_servicio_id) REFERENCES orden_servicio(id),
    CONSTRAINT fk_cr_repuesto FOREIGN KEY (repuesto_id) REFERENCES repuesto(id)
);

CREATE TABLE cotizacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orden_servicio_id INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NULL,
    monto_total DECIMAL(12,2) NOT NULL,
    estado ENUM('PENDIENTE', 'APROBADA', 'RECHAZADA') DEFAULT 'PENDIENTE',
    is_active ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cot_os FOREIGN KEY (orden_servicio_id) REFERENCES orden_servicio(id)
);

CREATE TABLE pago (
    id INT AUTO_INCREMENT PRIMARY KEY,
    referencia_tipo VARCHAR(50) NOT NULL,
    referencia_id INT NOT NULL,
    orden_servicio_id INT NULL,
    registrado_por_id INT NULL,
    metodo VARCHAR(50) NOT NULL,
    monto DECIMAL(12,2) NOT NULL,
    fecha DATETIME NOT NULL,
    estado ENUM('COMPLETADO', 'PENDIENTE', 'ANULADO') DEFAULT 'COMPLETADO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pago_orden FOREIGN KEY (orden_servicio_id) REFERENCES orden_servicio(id),
    CONSTRAINT fk_pago_usuario FOREIGN KEY (registrado_por_id) REFERENCES users(id)
);

CREATE TABLE garantia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orden_servicio_id INT NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    is_active ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_gar_os FOREIGN KEY (orden_servicio_id) REFERENCES orden_servicio(id)
);

-- =============================================================================
-- INSERCIÓN DE DATOS DE PRUEBA (DML) - PROYECTO CLIMATECT (MYSQL)
-- Asignatura: Base de Datos II
-- Estudiante: Brayan David Arévalo Luna
-- Motor: MySQL 8.0 (bd_clima_tec)
-- =============================================================================

USE bd_clima_tec;

-- 1. Clientes
INSERT INTO cliente (tipo_documento, numero_documento, nombre, telefono, email) VALUES
('CC', '1065001001', 'Hotel Guajira Real', '3001112233', 'contacto@guajirareal.com'),
('NIT', '900123456-1', 'Centro Comercial Viva', '3102223344', 'mantenimiento@viva.com'),
('CC', '1065001002', 'Restaurante El Mar', '3203334455', 'admin@elmar.com'),
('CC', '1065001003', 'Clinica del Norte', '3014445566', 'biomedica@clinicanorte.com'),
('NIT', '800987654-3', 'Supermercado Metro', '3155556677', 'servicios@metro.com');

-- 2. Equipos (Asociados a los clientes creados con IDs 162 al 166)
INSERT INTO equipo (cliente_id, nombre, descripcion) VALUES
(162, 'Aire Central Chiller 50TR', 'Ubicado en terraza principal del Hotel'),
(162, 'Split 24000 BTU - Recepcion', 'Mantenimiento mensual requerido'),
(163, 'Torre de Enfriamiento B1', 'Planta baja zona comercial'),
(164, 'Cámara Frigorífica Carnes', 'Temperatura de congelación -18C'),
(165, 'Aire Precisión Quirófano 1', 'Filtro HEPA e higrometria controlada'),
(166, 'Cortina de Aire Entrada', 'Sistema de paso continuo');

-- 3. Técnicos
INSERT INTO tecnico (nombre, descripcion) VALUES
('Brayan Arévalo', 'Técnico Especialista en Refrigeración Industrial'),
('Carlos Mendoza', 'Técnico de Campo - Climatización Comercial'),
('Andrés Villamizar', 'Especialista en Diagnóstico Eléctrico'),
('Diana Marcela Gómez', 'Supervisora de Mantenimiento Preventivo');

-- 4. Repuestos
-- Existencias restantes después de los consumos de servicio de prueba.
INSERT INTO repuesto (nombre, descripcion, precio, stock) VALUES
('Compresor Scroll 5HP', 'Compresor hermético R410A', 1250000.00, 8),
('Capacitor de Marcha 45uF', 'Capacitor para motor monofásico', 45000.00, 10),
('Gas Refrigerante R410A (Cilindro 11.3kg)', 'Refrigerante ecológico', 380000.00, 8),
('Filtro Secador 3/8 Soldable', 'Filtro deshidratador líquido', 65000.00, 9),
('Válvula de Expansión Termostática', 'Control de flujo de refrigerante', 210000.00, 10),
('Motor Ventilador Condensador 1/3HP', 'Motor de alta eficiencia', 320000.00, 10);

-- 5. Órdenes de Servicio (Asociadas a clientes 162..165, equipos 13..17 y técnicos 1..3)
INSERT INTO orden_servicio (cliente_id, equipo_id, tecnico_id, numero, fecha_apertura, total, estado) VALUES
(162, 13, 1, 'OS-2026-001', '2026-08-01 08:30:00', 1630000.00, 'CERRADA'),
(162, 14, 2, 'OS-2026-002', '2026-08-05 10:00:00', 445000.00, 'CERRADA'),
(163, 15, 1, 'OS-2026-003', '2026-08-10 14:15:00', 1250000.00, 'REPARACION'),
(164, 16, 3, 'OS-2026-004', '2026-08-15 09:00:00', 210000.00, 'DIAGNOSTICO'),
(165, 17, 2, 'OS-2026-005', '2026-08-20 11:30:00', 0.00, 'ABIERTA');

-- 6. Consumo de Repuestos
INSERT INTO consumo_repuesto (orden_servicio_id, repuesto_id, cantidad, precio_unitario) VALUES
(1, 1, 1, 1250000.00),
(1, 3, 1, 380000.00),
(2, 3, 1, 380000.00),
(2, 4, 1, 65000.00),
(3, 1, 1, 1250000.00);

-- 7. Diagnósticos
INSERT INTO diagnostico (orden_servicio_id, nombre, descripcion) VALUES
(1, 'Fuga de Gas Refrigerante y Compresor Quemado', 'Se detecta pérdida de presión en tubería principal y falla eléctrica en compresor'),
(2, 'Obstrucción en Filtro Secador', 'Filtro deshidratador tapado por impurezas en la línea de líquido'),
(3, 'Desgaste en Rodamientos de Ventilador', 'Ruido excesivo y sobrecalentamiento por falta de lubricación'),
(4, 'Falla en Tarjeta de Control', 'Sensor de temperatura descalibrado arrojando error de lectura'),
(5, 'Revisión General de Rutina', 'Inspección de presiones y limpieza de serpentín condensador');

-- 8. Cotizaciones
INSERT INTO cotizacion (orden_servicio_id, nombre, descripcion, monto_total, estado) VALUES
(1, 'Cotización Reparación Chiller', 'Incluye cambio de compresor 5HP y recarga de gas R410A', 1630000.00, 'APROBADA'),
(2, 'Cotización Mantenimiento Correctivo B1', 'Reemplazo de filtro secador y recarga parcial', 445000.00, 'APROBADA'),
(3, 'Cotización Cambio Compresor Cámara', 'Reemplazo de unidad hermética para refrigeración', 1250000.00, 'PENDIENTE'),
(4, 'Cotización Diagnóstico Electrónico', 'Reparación de tarjeta principal de control', 210000.00, 'RECHAZADA');

-- 9. Pagos
INSERT INTO pago (referencia_tipo, referencia_id, orden_servicio_id, metodo, monto, fecha, estado) VALUES
('ORDEN_SERVICIO', 1, 1, 'TRANSFERENCIA', 1630000.00, '2026-08-02 10:15:00', 'COMPLETADO'),
('ORDEN_SERVICIO', 2, 2, 'EFECTIVO', 445000.00, '2026-08-06 16:30:00', 'COMPLETADO'),
('COTIZACION', 1, 1, 'TARJETA_CREDITO', 500000.00, '2026-08-01 11:00:00', 'COMPLETADO');

-- 10. Garantías
INSERT INTO garantia (orden_servicio_id, nombre, descripcion, fecha_inicio, fecha_fin) VALUES
(1, 'Garantía Mantenimiento Chiller 6 Meses', 'Covers fallas de instalación y repuestos reemplazados', '2026-08-02', '2027-02-02'),
(2, 'Garantía Mantenimiento Preventivo 3 Meses', 'Garantía estándar sobre limpieza y filtro', '2026-08-06', '2026-11-06');
```

</details>

<details>
<summary>Consultas ? <code>Brayan/scripts/01-mysql/consultas/consultas_climatec.sql</code></summary>

```sql
-- =============================================================================
-- GUÍA Y REPORTES DE CONSULTAS SQL (DML) - PROYECTO 04: CLIMATECT
-- Asignatura: Base de Datos II
-- Estudiante: Brayan David Arévalo Luna
-- Motor: MySQL 8.0 (bd_clima_tec)
-- =============================================================================

USE bd_clima_tec;

-- 1. FILTRADO BÁSICO Y CONDICIONAL (WHERE)
SELECT * FROM cliente WHERE tipo_documento = 'CC';

SELECT * FROM orden_servicio WHERE estado = 'CERRADA' OR estado = 'REPARACION';

SELECT * FROM repuesto WHERE nombre LIKE '%Compresor%';

SELECT * FROM orden_servicio WHERE fecha_apertura BETWEEN '2026-08-01' AND '2026-08-31';

SELECT * FROM tecnico WHERE id IN (1, 2, 4);

SELECT * FROM orden_servicio WHERE fecha_cierre IS NULL;


-- 2. ORDENAMIENTO DE RESULTADOS (ORDER BY)
SELECT nombre, precio FROM repuesto ORDER BY precio DESC;


-- 3. AGRUPACIÓN Y FUNCIONES DE AGREGACIÓN (GROUP BY / HAVING)
SELECT tecnico_id, COUNT(*) AS total_ordenes FROM orden_servicio GROUP BY tecnico_id;

SELECT tecnico_id, COUNT(*) AS total_ordenes FROM orden_servicio GROUP BY tecnico_id HAVING COUNT(*) > 1;


-- 4. CONSULTAS MULTITABLA (JOIN)
SELECT c.nombre AS cliente, e.nombre AS equipo FROM equipo e INNER JOIN cliente c ON e.cliente_id = c.id;

SELECT os.numero, d.nombre AS diagnostico FROM orden_servicio os LEFT JOIN diagnostico d ON d.orden_servicio_id = os.id;


-- 5. SUBCONSULTAS ANIDADAS
SELECT nombre, precio FROM repuesto WHERE precio > (SELECT AVG(precio) FROM repuesto);


-- 6. PAGINACIÓN Y LÍMITES DE RESULTADOS (LIMIT)
SELECT nombre, precio FROM repuesto ORDER BY precio DESC LIMIT 3;


-- 7. CONSULTA INTEGRAL DE NEGOCIO (WHERE + JOIN + GROUP BY + HAVING + ORDER BY)
SELECT
    c.nombre AS cliente,
    COUNT(cr.id) AS cantidad_repuestos_usados,
    SUM(cr.cantidad * cr.precio_unitario) AS total_invertido
FROM consumo_repuesto cr
JOIN orden_servicio os ON cr.orden_servicio_id = os.id
JOIN cliente c ON os.cliente_id = c.id
WHERE os.estado = 'CERRADA'
GROUP BY c.id, c.nombre
HAVING SUM(cr.cantidad * cr.precio_unitario) > 500000
ORDER BY total_invertido DESC;
```

</details>

<details>
<summary>Procedimientos ? <code>Brayan/scripts/01-mysql/consultas/sp_climatec.sql</code></summary>

```sql
-- =============================================================================
-- PARTE 1: NARRATIVA, CONSULTAS AVANZADAS, PROCEDIMIENTOS ALMACENADOS PARAMETRIZADOS
-- Y TRIGGERS PARA CLIMATECT (MYSQL 8.0)
-- Estudiante: Brayan David Arévalo Luna
-- =============================================================================

USE bd_clima_tec;

DELIMITER //

-- -----------------------------------------------------------------------------
-- 1. CONSULTA / SP PARAMETRIZADO: Filtrado de Clientes por Tipo de Documento
-- NARRATIVA: El departamento de atención al cliente requiere consultar la lista
-- de clientes filtrando dinámicamente por su tipo de documento (CC, NIT, CE, etc.)
-- para generar reportes segmentados de la base de usuarios.
-- PASO A PASO:
--   1. Se define el procedimiento `sp_obtener_clientes_por_tipo_doc` recibiendo el parámetro `p_tipo_doc`.
--   2. Se ejecuta la consulta `SELECT` sobre la tabla `cliente` filtrando donde `tipo_documento = p_tipo_doc`.
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_obtener_clientes_por_tipo_doc//
CREATE PROCEDURE sp_obtener_clientes_por_tipo_doc(
    IN p_tipo_doc VARCHAR(10)
)
BEGIN
    SELECT id, nombre, tipo_documento, numero_documento, telefono, email
    FROM cliente
    WHERE tipo_documento = p_tipo_doc;
END//

-- -----------------------------------------------------------------------------
-- 2. CONSULTA / SP PARAMETRIZADO: Búsqueda de Repuestos por Nombre
-- NARRATIVA: El área de almacén e inventario necesita buscar repuestos mediante
-- un patrón de texto coincidente (como 'compresor' o 'filtro') para verificar
-- la disponibilidad, descripción y precio unitario en el catálogo.
-- PASO A PASO:
--   1. Se crea la rutina `sp_buscar_repuestos_por_nombre` aceptando `p_patron`.
--   2. Se utiliza la función `LIKE` concatenada con wildcards `%` sobre la columna `nombre`.
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_buscar_repuestos_por_nombre//
CREATE PROCEDURE sp_buscar_repuestos_por_nombre(
    IN p_patron VARCHAR(100)
)
BEGIN
    SELECT id, nombre, descripcion, precio
    FROM repuesto
    WHERE nombre LIKE CONCAT('%', p_patron, '%');
END//

-- -----------------------------------------------------------------------------
-- 3. CONSULTA / SP PARAMETRIZADO: Órdenes de Servicio por Rango de Fechas y Estado
-- NARRATIVA: La gerencia técnica requiere auditar y fiscalizar el flujo de órdenes
-- de servicio que fueron abiertas dentro de un periodo específico y que coincidan
-- con un estado operativo determinado ('CERRADA', 'EN_PROCESO', etc.).
-- PASO A PASO:
--   1. Se recibe un rango temporal (`p_fecha_inicio` y `p_fecha_fin`) y el estado (`p_estado`).
--   2. Se filtra con la cláusula `BETWEEN` sobre `fecha_apertura` e igualdad sobre `estado`.
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_obtener_ordenes_por_fecha_y_estado//
CREATE PROCEDURE sp_obtener_ordenes_por_fecha_y_estado(
    IN p_fecha_inicio DATETIME,
    IN p_fecha_fin DATETIME,
    IN p_estado VARCHAR(20)
)
BEGIN
    SELECT id, numero, fecha_apertura, estado, cliente_id, tecnico_id
    FROM orden_servicio
    WHERE fecha_apertura BETWEEN p_fecha_inicio AND p_fecha_fin
      AND estado = p_estado;
END//

-- -----------------------------------------------------------------------------
-- 4. CONSULTA / SP PARAMETRIZADO: Conteo de Órdenes Atendidas por Técnico con Filtro
-- NARRATIVA: El coordinador de personal necesita identificar a los técnicos que han
-- acumulado un número de órdenes asignadas mayor o igual a un umbral paramétrico
-- para balancear la carga laboral y calcular bonificaciones.
-- PASO A PASO:
--   1. Se realiza un `INNER JOIN` entre la tabla `tecnico` y `orden_servicio`.
--   2. Se agrupa por técnico (`GROUP BY`) y se aplica la restricción de agregación `HAVING COUNT(*) >= p_minimo_ordenes`.
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_tecnicos_con_minimo_ordenes//
CREATE PROCEDURE sp_tecnicos_con_minimo_ordenes(
    IN p_minimo_ordenes INT
)
BEGIN
    SELECT t.id, t.nombre AS tecnico, COUNT(os.id) AS total_ordenes
    FROM tecnico t
    INNER JOIN orden_servicio os ON os.tecnico_id = t.id
    GROUP BY t.id, t.nombre
    HAVING COUNT(os.id) >= p_minimo_ordenes;
END//

-- -----------------------------------------------------------------------------
-- 5. CONSULTA / SP PARAMETRIZADO: Reporte de Inversión en Repuestos por Cliente
-- NARRATIVA: Se requiere un informe financiero consolidado para listar a los clientes
-- cuya inversión acumulada en repuestos consumidos dentro de órdenes cerradas supere
-- un monto límite parametrizado.
-- PASO A PASO:
--   1. Se relacionan las entidades `consumo_repuesto`, `orden_servicio` y `cliente` mediante `JOIN`.
--   2. Se filtra por órdenes cerradas (`WHERE os.estado = 'CERRADA'`).
--   3. Se agrupa por cliente calculando el total invertido (`SUM(cantidad * precio_unitario)`) y se filtra con `HAVING >= p_monto_minimo`.
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_reporte_inversion_repuestos_cliente//
CREATE PROCEDURE sp_reporte_inversion_repuestos_cliente(
    IN p_monto_minimo DECIMAL(12,2)
)
BEGIN
    SELECT
        c.id AS cliente_id,
        c.nombre AS cliente,
        COUNT(cr.id) AS cantidad_repuestos_usados,
        SUM(cr.cantidad * cr.precio_unitario) AS total_invertido
    FROM consumo_repuesto cr
    INNER JOIN orden_servicio os ON cr.orden_servicio_id = os.id
    INNER JOIN cliente c ON os.cliente_id = c.id
    WHERE os.estado = 'CERRADA'
    GROUP BY c.id, c.nombre
    HAVING SUM(cr.cantidad * cr.precio_unitario) >= p_monto_minimo
    ORDER BY total_invertido DESC;
END//

-- -----------------------------------------------------------------------------
-- TRIGGERS (DISPARADORES DE NEGOCIO)
-- -----------------------------------------------------------------------------

-- Trigger 1: Auditoría Automática de Cierre de Órdenes de Servicio
-- NARRATIVA: Para evitar omisiones humanas al cerrar una orden técnica, cuando
-- una orden pase al estado 'CERRADA', el sistema asignará automáticamente la fecha
-- y hora actual del servidor en `fecha_cierre` si este campo no fue suministrado.
-- PASO A PASO:
--   1. Se declara un disparador de tipo `BEFORE UPDATE` sobre `orden_servicio`.
--   2. Se valida si el nuevo estado (`NEW.estado`) es 'CERRADA' y difiere del estado anterior (`OLD.estado`).
--   3. En caso afirmativo y si `NEW.fecha_cierre` está nulo, se establece `SET NEW.fecha_cierre = NOW()`.
DROP TRIGGER IF EXISTS trg_orden_servicio_auto_cierre//
CREATE TRIGGER trg_orden_servicio_auto_cierre
BEFORE UPDATE ON orden_servicio
FOR EACH ROW
BEGIN
    IF NEW.estado = 'CERRADA' AND OLD.estado <> 'CERRADA' THEN
        IF NEW.fecha_cierre IS NULL THEN
            SET NEW.fecha_cierre = NOW();
        END IF;
    END IF;
END//

DELIMITER ;
```

</details>

#### PostgreSQL 17

<details>
<summary>Esquema y datos iniciales ? <code>Brayan/scripts/02-postgresql/02_ddl_dml_climatec.sql</code></summary>

```sql
-- Base de datos para Proyecto 04: ClimaTec (PostgreSQL)

-- ==========================================
-- 1. SUBSISTEMA RBAC (Transversal)
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_active VARCHAR(20) DEFAULT 'ACTIVE' CHECK (is_active IN ('ACTIVE', 'INACTIVE')),
    avatar VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    is_active VARCHAR(20) DEFAULT 'ACTIVE' CHECK (is_active IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_users (
    id SERIAL PRIMARY KEY,
    role_id INT NOT NULL,
    user_id INT NOT NULL,
    is_active VARCHAR(20) DEFAULT 'ACTIVE' CHECK (is_active IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT fk_ru_role FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT fk_ru_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT uq_role_user UNIQUE (role_id, user_id)
);

CREATE TABLE IF NOT EXISTS resources (
    id SERIAL PRIMARY KEY,
    path VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    is_active VARCHAR(20) DEFAULT 'ACTIVE' CHECK (is_active IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT uq_path_method UNIQUE (path, method)
);

CREATE TABLE IF NOT EXISTS resource_roles (
    id SERIAL PRIMARY KEY,
    resource_id INT NOT NULL,
    role_id INT NOT NULL,
    is_active VARCHAR(20) DEFAULT 'ACTIVE' CHECK (is_active IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT fk_rr_resource FOREIGN KEY (resource_id) REFERENCES resources(id),
    CONSTRAINT fk_rr_role FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT uq_resource_role UNIQUE (resource_id, role_id)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    device_info VARCHAR(255) NOT NULL,
    is_valid VARCHAR(20) DEFAULT 'ACTIVE' CHECK (is_valid IN ('ACTIVE', 'INACTIVE')),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ==========================================
-- 2. DOMINIO CLIMATECT (Servicio Técnico)
-- ==========================================
CREATE TABLE IF NOT EXISTS cliente (
    id SERIAL PRIMARY KEY,
    tipo_documento VARCHAR(20) NOT NULL,
    numero_documento VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(30) NOT NULL,
    email VARCHAR(150) NOT NULL,
    address VARCHAR(255) NULL,
    is_active VARCHAR(20) DEFAULT 'ACTIVE' CHECK (is_active IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipo (
    id SERIAL PRIMARY KEY,
    cliente_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT NULL,
    is_active VARCHAR(20) DEFAULT 'ACTIVE' CHECK (is_active IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_equipo_cliente FOREIGN KEY (cliente_id) REFERENCES cliente(id)
);

CREATE TABLE IF NOT EXISTS tecnico (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion VARCHAR(255) NULL,
    is_active VARCHAR(20) DEFAULT 'ACTIVE' CHECK (is_active IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orden_servicio (
    id SERIAL PRIMARY KEY,
    cliente_id INT NOT NULL,
    equipo_id INT NOT NULL,
    tecnico_id INT NOT NULL,
    numero VARCHAR(50) NOT NULL UNIQUE,
    fecha_apertura TIMESTAMP NOT NULL,
    fecha_cierre TIMESTAMP NULL,
    total DECIMAL(12,2) DEFAULT 0.00,
    estado VARCHAR(30) DEFAULT 'ABIERTA' CHECK (estado IN ('ABIERTA', 'DIAGNOSTICO', 'COTIZADA', 'APROBADA', 'REPARACION', 'CERRADA', 'CANCELADA')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_os_cliente FOREIGN KEY (cliente_id) REFERENCES cliente(id),
    CONSTRAINT fk_os_equipo FOREIGN KEY (equipo_id) REFERENCES equipo(id),
    CONSTRAINT fk_os_tecnico FOREIGN KEY (tecnico_id) REFERENCES tecnico(id)
);

CREATE TABLE IF NOT EXISTS diagnostico (
    id SERIAL PRIMARY KEY,
    orden_servicio_id INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    is_active VARCHAR(20) DEFAULT 'ACTIVE' CHECK (is_active IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_diag_os FOREIGN KEY (orden_servicio_id) REFERENCES orden_servicio(id)
);

CREATE TABLE IF NOT EXISTS repuesto (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NULL,
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    is_active VARCHAR(20) DEFAULT 'ACTIVE' CHECK (is_active IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consumo_repuesto (
    id SERIAL PRIMARY KEY,
    orden_servicio_id INT NOT NULL,
    repuesto_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL,
    is_active VARCHAR(20) DEFAULT 'ACTIVE' CHECK (is_active IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cr_os FOREIGN KEY (orden_servicio_id) REFERENCES orden_servicio(id),
    CONSTRAINT fk_cr_repuesto FOREIGN KEY (repuesto_id) REFERENCES repuesto(id)
);

CREATE TABLE IF NOT EXISTS cotizacion (
    id SERIAL PRIMARY KEY,
    orden_servicio_id INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NULL,
    monto_total DECIMAL(12,2) NOT NULL,
    estado VARCHAR(30) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'APROBADA', 'RECHAZADA')),
    is_active VARCHAR(20) DEFAULT 'ACTIVE' CHECK (is_active IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cot_os FOREIGN KEY (orden_servicio_id) REFERENCES orden_servicio(id)
);

CREATE TABLE IF NOT EXISTS pago (
    id SERIAL PRIMARY KEY,
    referencia_tipo VARCHAR(50) NOT NULL,
    referencia_id INT NOT NULL,
    orden_servicio_id INT NULL REFERENCES orden_servicio(id),
    registrado_por_id INT NULL REFERENCES users(id),
    metodo VARCHAR(50) NOT NULL,
    monto DECIMAL(12,2) NOT NULL,
    fecha TIMESTAMP NOT NULL,
    estado VARCHAR(30) DEFAULT 'COMPLETADO' CHECK (estado IN ('COMPLETADO', 'PENDIENTE', 'ANULADO')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS garantia (
    id SERIAL PRIMARY KEY,
    orden_servicio_id INT NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    is_active VARCHAR(20) DEFAULT 'ACTIVE' CHECK (is_active IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_gar_os FOREIGN KEY (orden_servicio_id) REFERENCES orden_servicio(id)
);

-- INSERCIÓN DE DATOS DE PRUEBA (DML) - PROYECTO CLIMATECT (POSTGRESQL)

-- 1. Clientes
INSERT INTO cliente (tipo_documento, numero_documento, nombre, telefono, email) VALUES
('CC', '1065001001', 'Hotel Guajira Real', '3001112233', 'contacto@guajirareal.com'),
('NIT', '900123456-1', 'Centro Comercial Viva', '3102223344', 'mantenimiento@viva.com'),
('CC', '1065001002', 'Restaurante El Mar', '3203334455', 'admin@elmar.com'),
('CC', '1065001003', 'Clinica del Norte', '3014445566', 'biomedica@clinicanorte.com'),
('NIT', '800987654-3', 'Supermercado Metro', '3155556677', 'servicios@metro.com');

-- 2. Técnicos
INSERT INTO tecnico (nombre, descripcion) VALUES
('Brayan Arévalo', 'Técnico Especialista en Refrigeración Industrial'),
('Carlos Mendoza', 'Técnico de Campo - Climatización Comercial'),
('Andrés Villamizar', 'Especialista en Diagnóstico Eléctrico'),
('Diana Marcela Gómez', 'Supervisora de Mantenimiento Preventivo');

-- 3. Repuestos
-- Existencias restantes después de los consumos de servicio de prueba.
INSERT INTO repuesto (nombre, descripcion, precio, stock) VALUES
('Compresor Scroll 5HP', 'Compresor hermético R410A', 1250000.00, 8),
('Capacitor de Marcha 45uF', 'Capacitor para motor monofásico', 45000.00, 10),
('Gas Refrigerante R410A (Cilindro 11.3kg)', 'Refrigerante ecológico', 380000.00, 8),
('Filtro Secador 3/8 Soldable', 'Filtro deshidratador líquido', 65000.00, 9),
('Válvula de Expansión Termostática', 'Control de flujo de refrigerante', 210000.00, 10),
('Motor Ventilador Condensador 1/3HP', 'Motor de alta eficiencia', 320000.00, 10);

-- 4. Equipos (Asociados a los IDs de clientes existentes)
INSERT INTO equipo (cliente_id, nombre, descripcion) VALUES
(3, 'Aire Central Chiller 50TR', 'Ubicado en terraza del Hotel Guajira Real'),
(3, 'Split 24000 BTU - Recepcion', 'Área de atención al cliente'),
(4, 'Torre de Enfriamiento B1', 'Sistema de agua helada comercial'),
(5, 'Cámara Frigorífica Carnes', 'Temperatura de conservación -5°C'),
(6, 'Aire Precisión Quirófano 1', 'Control estricto de humedad y temperatura'),
(7, 'Cortina de Aire Entrada', 'Protección térmica en acceso principal');

-- 5. Órdenes de Servicio
INSERT INTO orden_servicio (cliente_id, equipo_id, tecnico_id, numero, fecha_apertura, total, estado) VALUES
(3, 9, 2, 'OS-2026-001', '2026-08-01 08:30:00', 1630000.00, 'CERRADA'),
(3, 10, 3, 'OS-2026-002', '2026-08-05 10:00:00', 445000.00, 'CERRADA'),
(4, 11, 2, 'OS-2026-003', '2026-08-10 14:15:00', 1250000.00, 'REPARACION'),
(5, 12, 4, 'OS-2026-004', '2026-08-15 09:00:00', 210000.00, 'DIAGNOSTICO'),
(6, 13, 3, 'OS-2026-005', '2026-08-20 11:30:00', 0.00, 'ABIERTA');

-- 6. Consumo de Repuestos
INSERT INTO consumo_repuesto (orden_servicio_id, repuesto_id, cantidad, precio_unitario) VALUES
(6, 1, 1, 1250000.00),
(6, 3, 1, 380000.00),
(7, 3, 1, 380000.00),
(7, 4, 1, 65000.00),
(8, 1, 1, 1250000.00);

-- 7. Diagnósticos
INSERT INTO diagnostico (orden_servicio_id, nombre, descripcion) VALUES
(6, 'Fuga de Gas Refrigerante y Compresor Quemado', 'Pérdida de presión en tubería principal y falla eléctrica'),
(7, 'Obstrucción en Filtro Secador', 'Filtro deshidratador tapado por impurezas en la línea'),
(8, 'Desgaste en Rodamientos de Ventilador', 'Ruido excesivo por falta de lubricación'),
(9, 'Falla en Tarjeta de Control', 'Sensor de temperatura descalibrado arrojando error'),
(10, 'Revisión General de Rutina', 'Inspección de presiones y limpieza de serpentín');

-- 8. Cotizaciones
INSERT INTO cotizacion (orden_servicio_id, nombre, descripcion, monto_total, estado) VALUES
(6, 'Cotización Reparación Chiller', 'Cambio de compresor 5HP y recarga de gas R410A', 1630000.00, 'APROBADA'),
(7, 'Cotización Mantenimiento Correctivo B1', 'Reemplazo de filtro secador y recarga parcial', 445000.00, 'APROBADA'),
(8, 'Cotización Cambio Compresor Cámara', 'Reemplazo de unidad hermética para refrigeración', 1250000.00, 'PENDIENTE'),
(9, 'Cotización Diagnóstico Electrónico', 'Reparación de tarjeta principal de control', 210000.00, 'RECHAZADA');

-- 9. Pagos
INSERT INTO pago (referencia_tipo, referencia_id, orden_servicio_id, metodo, monto, fecha, estado) VALUES
('ORDEN_SERVICIO', 6, 6, 'TRANSFERENCIA', 1630000.00, '2026-08-02 10:15:00', 'COMPLETADO'),
('ORDEN_SERVICIO', 7, 7, 'EFECTIVO', 445000.00, '2026-08-06 16:30:00', 'COMPLETADO'),
('COTIZACION', 1, 6, 'TARJETA_CREDITO', 500000.00, '2026-08-01 11:00:00', 'COMPLETADO');

-- 10. Garantías
INSERT INTO garantia (orden_servicio_id, nombre, descripcion, fecha_inicio, fecha_fin) VALUES
(6, 'Garantía Mantenimiento Chiller 6 Meses', 'Cubre fallas de instalación y repuestos reemplazados', '2026-08-02', '2027-02-02'),
(7, 'Garantía Mantenimiento Preventivo 3 Meses', 'Garantía estándar sobre limpieza y filtro', '2026-08-06', '2026-11-06');
```

</details>

<details>
<summary>Consultas ? <code>Brayan/scripts/02-postgresql/consultas/consultas_climatec.sql</code></summary>

```sql
-- =============================================================================
-- GUÍA DE CONSULTAS Y REPORTES SQL (DML) - CLIMATECT (POSTGRESQL)
-- Asignatura: Base de Datos II
-- Estudiante: Brayan David Arévalo Luna
-- Motor: PostgreSQL 17 (Esquema public)
-- =============================================================================

-- 1. FILTRADO BÁSICO Y CONDICIONAL (WHERE)
SELECT * FROM cliente WHERE tipo_documento = 'CC';

SELECT * FROM orden_servicio WHERE estado = 'CERRADA' OR estado = 'REPARACION';

SELECT * FROM repuesto WHERE nombre ILIKE '%compresor%';

SELECT * FROM orden_servicio WHERE fecha_apertura BETWEEN '2026-08-01 00:00:00' AND '2026-08-31 23:59:59';

SELECT * FROM tecnico WHERE id IN (2, 3, 4);

SELECT * FROM orden_servicio WHERE fecha_cierre IS NULL;


-- 2. ORDENAMIENTO DE RESULTADOS (ORDER BY)
SELECT nombre, precio FROM repuesto ORDER BY precio DESC;


-- 3. AGRUPACIÓN Y FUNCIONES DE AGREGACIÓN (GROUP BY / HAVING)
SELECT tecnico_id, COUNT(*) AS total_ordenes FROM orden_servicio GROUP BY tecnico_id;

SELECT tecnico_id, COUNT(*) AS total_ordenes FROM orden_servicio GROUP BY tecnico_id HAVING COUNT(*) > 1;


-- 4. CONSULTAS MULTITABLA (JOIN)
SELECT c.nombre AS cliente, e.nombre AS equipo FROM equipo e INNER JOIN cliente c ON e.cliente_id = c.id;

SELECT os.numero, d.nombre AS diagnostico FROM orden_servicio os LEFT JOIN diagnostico d ON d.orden_servicio_id = os.id;


-- 5. SUBCONSULTAS ANIDADAS
SELECT nombre, precio FROM repuesto WHERE precio > (SELECT AVG(precio) FROM repuesto);


-- 6. PAGINACIÓN Y LÍMITES DE RESULTADOS (LIMIT)
SELECT nombre, precio FROM repuesto ORDER BY precio DESC LIMIT 3;


-- 7. CONSULTA INTEGRAL DE NEGOCIO (WHERE + JOIN + GROUP BY + HAVING + ORDER BY)
SELECT
    c.nombre AS cliente,
    COUNT(cr.id) AS cantidad_repuestos_usados,
    SUM(cr.cantidad * cr.precio_unitario) AS total_invertido
FROM consumo_repuesto cr
JOIN orden_servicio os ON cr.orden_servicio_id = os.id
JOIN cliente c ON os.cliente_id = c.id
WHERE os.estado = 'CERRADA'
GROUP BY c.id, c.nombre
HAVING SUM(cr.cantidad * cr.precio_unitario) > 500000
ORDER BY total_invertido DESC;
```

</details>

<details>
<summary>Funciones y procedimientos ? <code>Brayan/scripts/02-postgresql/consultas/sp_climatec.sql</code></summary>

```sql
-- =============================================================================
-- PARTE 1: NARRATIVA, FUNCIONES PARAMETRIZADAS Y TRIGGERS PARA CLIMATECT (POSTGRESQL 17)
-- Estudiante: Brayan David Arévalo Luna
-- Motor: PostgreSQL 17 (Esquema public)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CONSULTA / SP PARAMETRIZADO: Filtrado de Clientes por Tipo de Documento
-- NARRATIVA: El área de atención al cliente requiere obtener la lista de clientes
-- filtrando dinámicamente por su tipo de documento (CC, NIT, CE, etc.).
-- PASO A PASO:
--   1. Se declara la función `sp_obtener_clientes_por_tipo_doc` que recibe `p_tipo_doc`.
--   2. Se retorna una tabla (`TABLE`) filtrando por `tipo_documento = p_tipo_doc`.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_obtener_clientes_por_tipo_doc(
    p_tipo_doc VARCHAR(10)
)
RETURNS TABLE (
    id INT,
    nombre VARCHAR,
    tipo_documento VARCHAR,
    numero_documento VARCHAR,
    telefono VARCHAR,
    email VARCHAR
)
LANGUAGE sql
AS $$ SELECT id, nombre, tipo_documento, numero_documento, telefono, email FROM cliente WHERE tipo_documento = p_tipo_doc; $$;

-- -----------------------------------------------------------------------------
-- 2. CONSULTA / SP PARAMETRIZADO: Búsqueda de Repuestos por Nombre
-- NARRATIVA: El área de almacén necesita buscar repuestos mediante un patrón de
-- texto coincidente e insensible a mayúsculas/minúsculas (`ILIKE`).
-- PASO A PASO:
--   1. Se crea la función `sp_buscar_repuestos_por_nombre` recibiendo `p_patron`.
--   2. Se aplica `ILIKE` concatenando '%' alrededor del parámetro con '||'.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_buscar_repuestos_por_nombre(
    p_patron VARCHAR(100)
)
RETURNS TABLE (
    id INT,
    nombre VARCHAR,
    descripcion TEXT,
    precio NUMERIC
)
LANGUAGE sql
AS $$ SELECT id, nombre, descripcion, precio FROM repuesto WHERE nombre ILIKE '\%' \vert{}\vert{} p_patron \vert{}\vert{} '\%'; $$;

-- -----------------------------------------------------------------------------
-- 3. CONSULTA / SP PARAMETRIZADO: Órdenes por Rango de Fechas y Estado
-- NARRATIVA: La gerencia técnica requiere auditar las órdenes de servicio abiertas
-- dentro de un rango de fechas específico y con un estado determinado.
-- PASO A PASO:
--   1. Recibe los parámetros `p_fecha_inicio`, `p_fecha_fin` y `p_estado`.
--   2. Filtra por rango `BETWEEN` sobre `fecha_apertura` e igualdad sobre `estado`.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_obtener_ordenes_por_fecha_y_estado(
    p_fecha_inicio TIMESTAMP,
    p_fecha_fin TIMESTAMP,
    p_estado VARCHAR(30)
)
RETURNS TABLE (
    id INT,
    numero VARCHAR,
    fecha_apertura TIMESTAMP,
    estado VARCHAR,
    cliente_id INT,
    tecnico_id INT
)
LANGUAGE sql
AS $$ SELECT id, numero, fecha_apertura, estado, cliente_id, tecnico_id FROM orden_servicio WHERE fecha_apertura BETWEEN p_fecha_inicio AND p_fecha_fin AND estado = p_estado; $$;

-- -----------------------------------------------------------------------------
-- 4. CONSULTA / SP PARAMETRIZADO: Conteo de Órdenes Atendidas por Técnico
-- NARRATIVA: El coordinador de personal necesita listar a los técnicos que
-- acumulan un número de órdenes asignadas mayor o igual a un umbral paramétrico.
-- PASO A PASO:
--   1. Se agrupa por técnico utilizando `INNER JOIN` y `GROUP BY`.
--   2. Se filtra el resultado agrupado mediante `HAVING COUNT(os.id) >= p_minimo_ordenes`.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_tecnicos_con_minimo_ordenes(
    p_minimo_ordenes INT
)
RETURNS TABLE (
    tecnico_id INT,
    tecnico VARCHAR,
    total_ordenes BIGINT
)
LANGUAGE sql
AS $$ SELECT t.id AS tecnico_id, t.nombre AS tecnico, COUNT(os.id) AS total_ordenes FROM tecnico t INNER JOIN orden_servicio os ON os.tecnico_id = t.id GROUP BY t.id, t.nombre HAVING COUNT(os.id) >= p_minimo_ordenes; $$;

-- -----------------------------------------------------------------------------
-- 5. CONSULTA / SP PARAMETRIZADO: Reporte de Inversión en Repuestos por Cliente
-- NARRATIVA: Informe consolidado de clientes cuya inversión acumulada en repuestos
-- para órdenes cerradas sea mayor o igual a un monto especificado.
-- PASO A PASO:
--   1. Se combinan las tablas `consumo_repuesto`, `orden_servicio` y `cliente`.
--   2. Se agrupa por cliente calculando la suma del costo y filtrando con `HAVING`.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_reporte_inversion_repuestos_cliente(
    p_monto_minimo NUMERIC
)
RETURNS TABLE (
    cliente_id INT,
    cliente VARCHAR,
    cantidad_repuestos_usados BIGINT,
    total_invertido NUMERIC
)
LANGUAGE sql
AS $$ SELECT c.id AS cliente_id, c.nombre AS cliente, COUNT(cr.id) AS cantidad_repuestos_usados, SUM(cr.cantidad * cr.precio_unitario) AS total_invertido FROM consumo_repuesto cr INNER JOIN orden_servicio os ON cr.orden_servicio_id = os.id INNER JOIN cliente c ON os.cliente_id = c.id WHERE os.estado = 'CERRADA' GROUP BY c.id, c.nombre HAVING SUM(cr.cantidad * cr.precio_unitario) >= p_monto_minimo ORDER BY total_invertido DESC; $$;

-- -----------------------------------------------------------------------------
-- TRIGGER DE NEGOCIO EN POSTGRESQL (Auto-cierre de Órdenes de Servicio)
-- NARRATIVA: Cuando una orden cambia a estado 'CERRADA', se establece automáticamente
-- la fecha actual en `fecha_cierre` si esta no fue proporcionada.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_orden_servicio_auto_cierre()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$ BEGIN IF NEW.estado = 'CERRADA' AND OLD.estado <> 'CERRADA' THEN IF NEW.fecha_cierre IS NULL THEN NEW.fecha_cierre := CURRENT_TIMESTAMP; END IF; END IF; RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_orden_servicio_auto_cierre ON orden_servicio;

CREATE TRIGGER trg_orden_servicio_auto_cierre
BEFORE UPDATE ON orden_servicio
FOR EACH ROW
EXECUTE FUNCTION fn_trg_orden_servicio_auto_cierre();
```

</details>

#### Microsoft SQL Server 2022

<details>
<summary>Esquema y datos iniciales ? <code>Brayan/scripts/03-sql-server/03_ddl_dml_climatec.sql</code></summary>

```sql
-- Base de datos para Proyecto 04: ClimaTec (SQL Server 2022)

-- Crear Base de Datos si no existe
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'bd_clima_tec')
BEGIN
    CREATE DATABASE bd_clima_tec;
END;
GO

USE bd_clima_tec;
GO

-- ==========================================
-- 1. SUBSISTEMA RBAC
-- ==========================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(100) NOT NULL UNIQUE,
    email NVARCHAR(150) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    is_active NVARCHAR(20) DEFAULT 'ACTIVE' CHECK (is_active IN ('ACTIVE', 'INACTIVE')),
    avatar NVARCHAR(255) NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'roles')
CREATE TABLE roles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(50) NOT NULL UNIQUE,
    is_active NVARCHAR(20) DEFAULT 'ACTIVE' CHECK (is_active IN ('ACTIVE', 'INACTIVE')),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'role_users')
CREATE TABLE role_users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    role_id INT NOT NULL,
    user_id INT NOT NULL,
    is_active NVARCHAR(20) DEFAULT 'ACTIVE' CHECK (is_active IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT fk_ru_role FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT fk_ru_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT uq_role_user UNIQUE (role_id, user_id)
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'resources')
CREATE TABLE resources (
    id INT IDENTITY(1,1) PRIMARY KEY,
    path NVARCHAR(255) NOT NULL,
    method NVARCHAR(10) NOT NULL,
    is_active NVARCHAR(20) DEFAULT 'ACTIVE' CHECK (is_active IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT uq_path_method UNIQUE (path, method)
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'resource_roles')
CREATE TABLE resource_roles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    resource_id INT NOT NULL,
    role_id INT NOT NULL,
    is_active NVARCHAR(20) DEFAULT 'ACTIVE' CHECK (is_active IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT fk_rr_resource FOREIGN KEY (resource_id) REFERENCES resources(id),
    CONSTRAINT fk_rr_role FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT uq_resource_role UNIQUE (resource_id, role_id)
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'refresh_tokens')
CREATE TABLE refresh_tokens (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    token NVARCHAR(255) NOT NULL,
    device_info NVARCHAR(255) NOT NULL,
    is_valid NVARCHAR(20) DEFAULT 'ACTIVE' CHECK (is_valid IN ('ACTIVE', 'INACTIVE')),
    expires_at DATETIME2 NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ==========================================
-- 2. DOMINIO CLIMATECT
-- ==========================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cliente')
CREATE TABLE cliente (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tipo_documento NVARCHAR(20) NOT NULL,
    numero_documento NVARCHAR(30) NOT NULL UNIQUE,
    nombre NVARCHAR(150) NOT NULL,
    telefono NVARCHAR(30) NOT NULL,
    email NVARCHAR(150) NOT NULL,
    address NVARCHAR(255) NULL,
    is_active NVARCHAR(20) DEFAULT 'ACTIVE' CHECK (is_active IN ('ACTIVE', 'INACTIVE')),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'equipo')
CREATE TABLE equipo (
    id INT IDENTITY(1,1) PRIMARY KEY,
    cliente_id INT NOT NULL,
    nombre NVARCHAR(100) NOT NULL,
    descripcion NVARCHAR(MAX) NULL,
    is_active NVARCHAR(20) DEFAULT 'ACTIVE' CHECK (is_active IN ('ACTIVE', 'INACTIVE')),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_equipo_cliente FOREIGN KEY (cliente_id) REFERENCES cliente(id)
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tecnico')
CREATE TABLE tecnico (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(150) NOT NULL,
    descripcion NVARCHAR(255) NULL,
    is_active NVARCHAR(20) DEFAULT 'ACTIVE' CHECK (is_active IN ('ACTIVE', 'INACTIVE')),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'orden_servicio')
CREATE TABLE orden_servicio (
    id INT IDENTITY(1,1) PRIMARY KEY,
    cliente_id INT NOT NULL,
    equipo_id INT NOT NULL,
    tecnico_id INT NOT NULL,
    numero NVARCHAR(50) NOT NULL UNIQUE,
    fecha_apertura DATETIME2 NOT NULL,
    fecha_cierre DATETIME2 NULL,
    total DECIMAL(12,2) DEFAULT 0.00,
    estado NVARCHAR(30) DEFAULT 'ABIERTA' CHECK (estado IN ('ABIERTA', 'DIAGNOSTICO', 'COTIZADA', 'APROBADA', 'REPARACION', 'CERRADA', 'CANCELADA')),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_os_cliente FOREIGN KEY (cliente_id) REFERENCES cliente(id),
    CONSTRAINT fk_os_equipo FOREIGN KEY (equipo_id) REFERENCES equipo(id),
    CONSTRAINT fk_os_tecnico FOREIGN KEY (tecnico_id) REFERENCES tecnico(id)
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'diagnostico')
CREATE TABLE diagnostico (
    id INT IDENTITY(1,1) PRIMARY KEY,
    orden_servicio_id INT NOT NULL,
    nombre NVARCHAR(150) NOT NULL,
    descripcion NVARCHAR(MAX) NOT NULL,
    is_active NVARCHAR(20) DEFAULT 'ACTIVE' CHECK (is_active IN ('ACTIVE', 'INACTIVE')),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_diag_os FOREIGN KEY (orden_servicio_id) REFERENCES orden_servicio(id)
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'repuesto')
CREATE TABLE repuesto (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(150) NOT NULL,
    descripcion NVARCHAR(MAX) NULL,
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    is_active NVARCHAR(20) DEFAULT 'ACTIVE' CHECK (is_active IN ('ACTIVE', 'INACTIVE')),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'consumo_repuesto')
CREATE TABLE consumo_repuesto (
    id INT IDENTITY(1,1) PRIMARY KEY,
    orden_servicio_id INT NOT NULL,
    repuesto_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL,
    is_active NVARCHAR(20) DEFAULT 'ACTIVE' CHECK (is_active IN ('ACTIVE', 'INACTIVE')),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_cr_os FOREIGN KEY (orden_servicio_id) REFERENCES orden_servicio(id),
    CONSTRAINT fk_cr_repuesto FOREIGN KEY (repuesto_id) REFERENCES repuesto(id)
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cotizacion')
CREATE TABLE cotizacion (
    id INT IDENTITY(1,1) PRIMARY KEY,
    orden_servicio_id INT NOT NULL,
    nombre NVARCHAR(150) NOT NULL,
    descripcion NVARCHAR(MAX) NULL,
    monto_total DECIMAL(12,2) NOT NULL,
    estado NVARCHAR(30) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'APROBADA', 'RECHAZADA')),
    is_active NVARCHAR(20) DEFAULT 'ACTIVE' CHECK (is_active IN ('ACTIVE', 'INACTIVE')),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_cot_os FOREIGN KEY (orden_servicio_id) REFERENCES orden_servicio(id)
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'pago')
CREATE TABLE pago (
    id INT IDENTITY(1,1) PRIMARY KEY,
    referencia_tipo NVARCHAR(50) NOT NULL,
    referencia_id INT NOT NULL,
    orden_servicio_id INT NULL,
    registrado_por_id INT NULL,
    metodo NVARCHAR(50) NOT NULL,
    monto DECIMAL(12,2) NOT NULL,
    fecha DATETIME2 NOT NULL,
    estado NVARCHAR(30) DEFAULT 'COMPLETADO' CHECK (estado IN ('COMPLETADO', 'PENDIENTE', 'ANULADO')),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_pago_orden FOREIGN KEY (orden_servicio_id) REFERENCES orden_servicio(id),
    CONSTRAINT fk_pago_usuario FOREIGN KEY (registrado_por_id) REFERENCES users(id)
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'garantia')
CREATE TABLE garantia (
    id INT IDENTITY(1,1) PRIMARY KEY,
    orden_servicio_id INT NOT NULL UNIQUE,
    nombre NVARCHAR(150) NOT NULL,
    descripcion NVARCHAR(MAX) NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    is_active NVARCHAR(20) DEFAULT 'ACTIVE' CHECK (is_active IN ('ACTIVE', 'INACTIVE')),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_gar_os FOREIGN KEY (orden_servicio_id) REFERENCES orden_servicio(id)
);

-- =============================================================================
-- INSERCIÓN DE DATOS DE PRUEBA (DML) - PROYECTO CLIMATECT (SQL SERVER 2022)
-- Asignatura: Base de Datos II
-- Estudiante: Brayan David Arévalo Luna
-- Motor: Microsoft SQL Server 2022 (dbo)
-- =============================================================================

USE bd_clima_tec;
GO

-- 1. Clientes (IDs generados automáticamente por IDENTITY: 2, 3, 4, 5, 6)
INSERT INTO cliente (tipo_documento, numero_documento, nombre, telefono, email) VALUES
('CC', '1065001001', 'Hotel Guajira Real', '3001112233', 'contacto@guajirareal.com'),
('NIT', '900123456-1', 'Centro Comercial Viva', '3102223344', 'mantenimiento@viva.com'),
('CC', '1065001002', 'Restaurante El Mar', '3203334455', 'admin@elmar.com'),
('CC', '1065001003', 'Clinica del Norte', '3014445566', 'biomedica@clinicanorte.com'),
('NIT', '800987654-3', 'Supermercado Metro', '3155556677', 'servicios@metro.com');

-- 2. Equipos (Asociados a los clientes con IDs 2 al 6)
INSERT INTO equipo (cliente_id, nombre, descripcion) VALUES
(2, 'Aire Central Chiller 50TR', 'Ubicado en terraza principal del Hotel'),
(2, 'Split 24000 BTU - Recepcion', 'Mantenimiento mensual requerido'),
(3, 'Torre de Enfriamiento B1', 'Planta baja zona comercial'),
(4, 'Cámara Frigorífica Carnes', 'Temperatura de congelación -18C'),
(5, 'Aire Precisión Quirófano 1', 'Filtro HEPA e higrometria controlada'),
(6, 'Cortina de Aire Entrada', 'Sistema de paso continuo');

-- 3. Técnicos (IDs generados: 1, 2, 3, 4)
INSERT INTO tecnico (nombre, descripcion) VALUES
('Brayan Arévalo', 'Técnico Especialista en Refrigeración Industrial'),
('Carlos Mendoza', 'Técnico de Campo - Climatización Comercial'),
('Andrés Villamizar', 'Especialista en Diagnóstico Eléctrico'),
('Diana Marcela Gómez', 'Supervisora de Mantenimiento Preventivo');

-- 4. Repuestos (IDs generados: 1, 2, 3, 4, 5, 6)
-- Existencias restantes después de los consumos de servicio de prueba.
INSERT INTO repuesto (nombre, descripcion, precio, stock) VALUES
('Compresor Scroll 5HP', 'Compresor hermético R410A', 1250000.00, 8),
('Capacitor de Marcha 45uF', 'Capacitor para motor monofásico', 45000.00, 10),
('Gas Refrigerante R410A (Cilindro 11.3kg)', 'Refrigerante ecológico', 380000.00, 8),
('Filtro Secador 3/8 Soldable', 'Filtro deshidratador líquido', 65000.00, 9),
('Válvula de Expansión Termostática', 'Control de flujo de refrigerante', 210000.00, 10),
('Motor Ventilador Condensador 1/3HP', 'Motor de alta eficiencia', 320000.00, 10);

-- 5. Órdenes de Servicio (Asociadas a clientes 2..5, equipos 1..5 y técnicos 1..3)
INSERT INTO orden_servicio (cliente_id, equipo_id, tecnico_id, numero, fecha_apertura, total, estado) VALUES
(2, 1, 1, 'OS-2026-001', '2026-08-01 08:30:00', 1630000.00, 'CERRADA'),
(2, 2, 2, 'OS-2026-002', '2026-08-05 10:00:00', 445000.00, 'CERRADA'),
(3, 3, 1, 'OS-2026-003', '2026-08-10 14:15:00', 1250000.00, 'REPARACION'),
(4, 4, 3, 'OS-2026-004', '2026-08-15 09:00:00', 210000.00, 'DIAGNOSTICO'),
(5, 5, 2, 'OS-2026-005', '2026-08-20 11:30:00', 0.00, 'ABIERTA');

-- 6. Consumo de Repuestos (Asociados a las órdenes 1, 2 y 3)
INSERT INTO consumo_repuesto (orden_servicio_id, repuesto_id, cantidad, precio_unitario) VALUES
(1, 1, 1, 1250000.00),
(1, 3, 1, 380000.00),
(2, 3, 1, 380000.00),
(2, 4, 1, 65000.00),
(3, 1, 1, 1250000.00);

-- 7. Diagnósticos (Asociados a las órdenes 1 a 5)
INSERT INTO diagnostico (orden_servicio_id, nombre, descripcion) VALUES
(1, 'Fuga de Gas Refrigerante y Compresor Quemado', 'Se detecta pérdida de presión en tubería principal y falla eléctrica en compresor'),
(2, 'Obstrucción en Filtro Secador', 'Filtro deshidratador tapado por impurezas en la línea de líquido'),
(3, 'Desgaste en Rodamientos de Ventilador', 'Ruido excesivo y sobrecalentamiento por falta de lubricación'),
(4, 'Falla en Tarjeta de Control', 'Sensor de temperatura descalibrado arrojando error de lectura'),
(5, 'Revisión General de Rutina', 'Inspección de presiones y limpieza de serpentín condensador');

-- 8. Cotizaciones (Asociadas a las órdenes 1 a 4)
INSERT INTO cotizacion (orden_servicio_id, nombre, descripcion, monto_total, estado) VALUES
(1, 'Cotización Reparación Chiller', 'Incluye cambio de compresor 5HP y recarga de gas R410A', 1630000.00, 'APROBADA'),
(2, 'Cotización Mantenimiento Correctivo B1', 'Reemplazo de filtro secador y recarga parcial', 445000.00, 'APROBADA'),
(3, 'Cotización Cambio Compresor Cámara', 'Reemplazo de unidad hermética para refrigeración', 1250000.00, 'PENDIENTE'),
(4, 'Cotización Diagnóstico Electrónico', 'Reparación de tarjeta principal de control', 210000.00, 'RECHAZADA');

-- 9. Pagos
INSERT INTO pago (referencia_tipo, referencia_id, orden_servicio_id, metodo, monto, fecha, estado) VALUES
('ORDEN_SERVICIO', 1, 1, 'TRANSFERENCIA', 1630000.00, '2026-08-02 10:15:00', 'COMPLETADO'),
('ORDEN_SERVICIO', 2, 2, 'EFECTIVO', 445000.00, '2026-08-06 16:30:00', 'COMPLETADO'),
('COTIZACION', 1, 1, 'TARJETA_CREDITO', 500000.00, '2026-08-01 11:00:00', 'COMPLETADO');

-- 10. Garantías (Asociadas a las órdenes 1 y 2)
INSERT INTO garantia (orden_servicio_id, nombre, descripcion, fecha_inicio, fecha_fin) VALUES
(1, 'Garantía Mantenimiento Chiller 6 Meses', 'Covers fallas de instalación y repuestos reemplazados', '2026-08-02', '2027-02-02'),
(2, 'Garantía Mantenimiento Preventivo 3 Meses', 'Garantía estándar sobre limpieza y filtro', '2026-08-06', '2026-11-06');
GO
```

</details>

<details>
<summary>Consultas ? <code>Brayan/scripts/03-sql-server/consultas/consultas_climatec.sql</code></summary>

```sql
-- =============================================================================
-- GUÍA DE CONSULTAS Y REPORTES SQL (DML) - CLIMATECT (SQL SERVER 2022)
-- Asignatura: Base de Datos II
-- Estudiante: Brayan David Arévalo Luna
-- Motor: Microsoft SQL Server 2022 (bd_clima_tec / dbo)
-- =============================================================================

USE bd_clima_tec;
GO

-- -----------------------------------------------------------------------------
-- 1. FILTRADO BÁSICO Y CONDICIONAL (WHERE)
-- -----------------------------------------------------------------------------

-- 1.1 Filtrado por Igualdad / Condición Exacta:
-- Obtener únicamente los clientes cuyo tipo de documento sea Cédula (CC)
SELECT * FROM cliente
WHERE tipo_documento = 'CC';

-- 1.2 Operadores Lógicos (AND, OR, NOT):
-- Buscar órdenes de servicio que estén 'CERRADA' O 'REPARACION'
SELECT * FROM orden_servicio
WHERE estado = 'CERRADA' OR estado = 'REPARACION';

-- 1.3 Búsqueda de Patrones de Texto (LIKE en SQL Server):
-- Buscar repuestos que contengan la palabra 'compresor' en su nombre
SELECT * FROM repuesto
WHERE nombre LIKE '%compresor%';

-- 1.4 Rangos de Valores (BETWEEN con DATETIME2):
-- Buscar órdenes abiertas durante el mes de agosto de 2026
SELECT * FROM orden_servicio
WHERE fecha_apertura BETWEEN '2026-08-01 00:00:00' AND '2026-08-31 23:59:59';

-- 1.5 Listas de Opciones (IN):
-- Buscar técnicos con IDs específicos (1, 2, 3)
SELECT * FROM tecnico
WHERE id IN (1, 2, 3);

-- 1.6 Manejo de Valores Nulos (IS NULL / IS NOT NULL):
-- Buscar órdenes que aún no han sido cerradas (fecha_cierre no registrada)
SELECT * FROM orden_servicio
WHERE fecha_cierre IS NULL;


-- -----------------------------------------------------------------------------
-- 2. ORDENAMIENTO DE RESULTADOS (ORDER BY)
-- -----------------------------------------------------------------------------

-- Listar repuestos ordenados desde el más costoso al más barato
SELECT nombre, precio
FROM repuesto
ORDER BY precio DESC;


-- -----------------------------------------------------------------------------
-- 3. AGRUPACIÓN Y FUNCIONES DE AGREGACIÓN (GROUP BY / HAVING)
-- -----------------------------------------------------------------------------

-- 3.1 Agregaciones Básicas (COUNT, SUM, AVG):
-- Contar cuántas órdenes ha atendido cada técnico
SELECT tecnico_id, COUNT(*) AS total_ordenes
FROM orden_servicio
GROUP BY tecnico_id;

-- 3.2 Filtrado sobre Agrupaciones (HAVING):
-- Mostrar solo los técnicos que tengan más de 1 orden asignada
SELECT tecnico_id, COUNT(*) AS total_ordenes
FROM orden_servicio
GROUP BY tecnico_id
HAVING COUNT(*) > 1;


-- -----------------------------------------------------------------------------
-- 4. CONSULTAS MULTITABLA / COMBINACIONES (JOIN)
-- -----------------------------------------------------------------------------

-- 4.1 INNER JOIN (Coincidencia exacta entre tablas):
-- Obtener el nombre del cliente y el equipo que posee
SELECT c.nombre AS cliente, e.nombre AS equipo
FROM equipo e
INNER JOIN cliente c ON e.cliente_id = c.id;

-- 4.2 LEFT JOIN (Inclusión de todos los registros de la izquierda):
-- Mostrar todas las órdenes y sus diagnósticos correspondientes
SELECT os.numero, d.nombre AS diagnostico
FROM orden_servicio os
LEFT JOIN diagnostico d ON d.orden_servicio_id = os.id;


-- -----------------------------------------------------------------------------
-- 5. SUBCONSULTAS (CONSULTAS ANIDADAS)
-- -----------------------------------------------------------------------------

-- Obtener los repuestos cuyo precio sea SUPERIOR al promedio general del catálogo
SELECT nombre, precio
FROM repuesto
WHERE precio > (SELECT AVG(precio) FROM repuesto);


-- -----------------------------------------------------------------------------
-- 6. PAGINACIÓN Y LÍMITES DE RESULTADOS (TOP en T-SQL)
-- -----------------------------------------------------------------------------

-- Mostrar únicamente los 3 repuestos más caros en SQL Server
SELECT TOP 3 nombre, precio
FROM repuesto
ORDER BY precio DESC;


-- -----------------------------------------------------------------------------
-- 7. CONSULTA INTEGRAL DE NEGOCIO (WHERE + JOIN + GROUP BY + HAVING + ORDER BY)
-- -----------------------------------------------------------------------------

-- Calcular el total invertido en repuestos por cliente en órdenes cerradas que superen $500,000
SELECT
    c.nombre AS cliente,
    COUNT(cr.id) AS cantidad_repuestos_usados,
    SUM(cr.cantidad * cr.precio_unitario) AS total_invertido
FROM consumo_repuesto cr
JOIN orden_servicio os ON cr.orden_servicio_id = os.id
JOIN cliente c ON os.cliente_id = c.id
WHERE os.estado = 'CERRADA'
GROUP BY c.id, c.nombre
HAVING SUM(cr.cantidad * cr.precio_unitario) > 500000
ORDER BY total_invertido DESC;
GO
```

</details>

<details>
<summary>Procedimientos ? <code>Brayan/scripts/03-sql-server/consultas/sp_climatec.sql</code></summary>

```sql
-- =============================================================================
-- PARTE 1: NARRATIVA, PROCEDIMIENTOS ALMACENADOS PARAMETRIZADOS
-- Y TRIGGERS PARA CLIMATECT (MS SQL SERVER 2022 - T-SQL)
-- Estudiante: Brayan David Arévalo Luna
-- Motor: MS SQL Server 2022 (`bd_clima_tec`)
-- =============================================================================

USE bd_clima_tec;
GO

-- -----------------------------------------------------------------------------
-- 1. SP PARAMETRIZADO: Filtrado de Clientes por Tipo de Documento
-- NARRATIVA: El departamento de atención al cliente requiere obtener la lista
-- de clientes filtrando dinámicamente por tipo de documento (CC, NIT, CE, etc.).
-- -----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_obtener_clientes_por_tipo_doc
    @p_tipo_doc NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, nombre, tipo_documento, numero_documento, telefono, email
    FROM cliente
    WHERE tipo_documento = @p_tipo_doc;
END;
GO

-- -----------------------------------------------------------------------------
-- 2. SP PARAMETRIZADO: Búsqueda de Repuestos por Nombre
-- NARRATIVA: El área de almacén e inventario necesita buscar repuestos mediante
-- un patrón de texto coincidente para verificar disponibilidad y precio unitario.
-- -----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_buscar_repuestos_por_nombre
    @p_patron NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, nombre, descripcion, precio
    FROM repuesto
    WHERE nombre LIKE '%' + @p_patron + '%';
END;
GO

-- -----------------------------------------------------------------------------
-- 3. SP PARAMETRIZADO: Órdenes de Servicio por Rango de Fechas y Estado
-- NARRATIVA: La gerencia técnica requiere auditar las órdenes de servicio que fueron
-- abiertas dentro de un periodo específico y que coincidan con un estado determinado.
-- -----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_obtener_ordenes_por_fecha_y_estado
    @p_fecha_inicio DATETIME2,
    @p_fecha_fin DATETIME2,
    @p_estado NVARCHAR(30)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, numero, fecha_apertura, estado, cliente_id, tecnico_id
    FROM orden_servicio
    WHERE fecha_apertura BETWEEN @p_fecha_inicio AND @p_fecha_fin
      AND estado = @p_estado;
END;
GO

-- -----------------------------------------------------------------------------
-- 4. SP PARAMETRIZADO: Conteo de Órdenes Atendidas por Técnico
-- NARRATIVA: El coordinador de personal necesita listar los técnicos que han acumulado
-- un número de órdenes asignadas mayor o igual a un umbral paramétrico.
-- -----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_tecnicos_con_minimo_ordenes
    @p_minimo_ordenes INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT t.id AS tecnico_id, t.nombre AS tecnico, COUNT(os.id) AS total_ordenes
    FROM tecnico t
    INNER JOIN orden_servicio os ON os.tecnico_id = t.id
    GROUP BY t.id, t.nombre
    HAVING COUNT(os.id) >= @p_minimo_ordenes;
END;
GO

-- -----------------------------------------------------------------------------
-- 5. SP PARAMETRIZADO: Reporte de Inversión en Repuestos por Cliente
-- NARRATIVA: Informe financiero consolidado de clientes cuya inversión acumulada
-- en repuestos para órdenes cerradas sea mayor o igual a un monto especificado.
-- -----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_reporte_inversion_repuestos_cliente
    @p_monto_minimo DECIMAL(12,2)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        c.id AS cliente_id,
        c.nombre AS cliente,
        COUNT(cr.id) AS cantidad_repuestos_usados,
        SUM(cr.cantidad * cr.precio_unitario) AS total_invertido
    FROM consumo_repuesto cr
    INNER JOIN orden_servicio os ON cr.orden_servicio_id = os.id
    INNER JOIN cliente c ON os.cliente_id = c.id
    WHERE os.estado = 'CERRADA'
    GROUP BY c.id, c.nombre
    HAVING SUM(cr.cantidad * cr.precio_unitario) >= @p_monto_minimo
    ORDER BY total_invertido DESC;
END;
GO

-- -----------------------------------------------------------------------------
-- TRIGGER DE NEGOCIO EN T-SQL (Auto-cierre de Órdenes de Servicio)
-- NARRATIVA: Cuando una orden cambia a 'CERRADA', el sistema asigna automáticamente
-- la fecha actual en `fecha_cierre` si esta no fue especificada.
-- -----------------------------------------------------------------------------
CREATE OR ALTER TRIGGER trg_orden_servicio_auto_cierre
ON orden_servicio
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF UPDATE(estado)
    BEGIN
        UPDATE os
        SET fecha_cierre = GETDATE()
        FROM orden_servicio os
        INNER JOIN inserted i ON os.id = i.id
        INNER JOIN deleted d ON os.id = d.id
        WHERE i.estado = 'CERRADA'
          AND d.estado <> 'CERRADA'
          AND i.fecha_cierre IS NULL;
    END
END;
GO
```

</details>

#### Oracle Database XE 21c

<details>
<summary>Esquema y datos iniciales ? <code>Brayan/scripts/04-oracle/04_ddl_dml_climatec.sql</code></summary>

```sql
-- Base de datos para Proyecto 04: ClimaTec (Oracle Database 21c XE)

-- ==========================================
-- 1. SUBSISTEMA RBAC
-- ==========================================
BEGIN
   EXECUTE IMMEDIATE 'CREATE TABLE users (
       id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
       username VARCHAR2(100) NOT NULL UNIQUE,
       email VARCHAR2(150) NOT NULL UNIQUE,
       password VARCHAR2(255) NOT NULL,
       is_active VARCHAR2(20) DEFAULT ''ACTIVE'' CHECK (is_active IN (''ACTIVE'', ''INACTIVE'')),
       avatar VARCHAR2(255) NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   )';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF;
END;
/

BEGIN
   EXECUTE IMMEDIATE 'CREATE TABLE roles (
       id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
       name VARCHAR2(50) NOT NULL UNIQUE,
       is_active VARCHAR2(20) DEFAULT ''ACTIVE'' CHECK (is_active IN (''ACTIVE'', ''INACTIVE'')),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   )';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF;
END;
/

BEGIN
   EXECUTE IMMEDIATE 'CREATE TABLE role_users (
       id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
       role_id NUMBER NOT NULL,
       user_id NUMBER NOT NULL,
       is_active VARCHAR2(20) DEFAULT ''ACTIVE'' CHECK (is_active IN (''ACTIVE'', ''INACTIVE'')),
       CONSTRAINT fk_ru_role FOREIGN KEY (role_id) REFERENCES roles(id),
       CONSTRAINT fk_ru_user FOREIGN KEY (user_id) REFERENCES users(id),
       CONSTRAINT uq_role_user UNIQUE (role_id, user_id)
   )';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF;
END;
/

BEGIN
   EXECUTE IMMEDIATE 'CREATE TABLE resources (
       id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
       path VARCHAR2(255) NOT NULL,
       method VARCHAR2(10) NOT NULL,
       is_active VARCHAR2(20) DEFAULT ''ACTIVE'' CHECK (is_active IN (''ACTIVE'', ''INACTIVE'')),
       CONSTRAINT uq_path_method UNIQUE (path, method)
   )';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF;
END;
/

BEGIN
   EXECUTE IMMEDIATE 'CREATE TABLE resource_roles (
       id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
       resource_id NUMBER NOT NULL,
       role_id NUMBER NOT NULL,
       is_active VARCHAR2(20) DEFAULT ''ACTIVE'' CHECK (is_active IN (''ACTIVE'', ''INACTIVE'')),
       CONSTRAINT fk_rr_resource FOREIGN KEY (resource_id) REFERENCES resources(id),
       CONSTRAINT fk_rr_role FOREIGN KEY (role_id) REFERENCES roles(id),
       CONSTRAINT uq_resource_role UNIQUE (resource_id, role_id)
   )';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF;
END;
/

BEGIN
   EXECUTE IMMEDIATE 'CREATE TABLE refresh_tokens (
       id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
       user_id NUMBER NOT NULL,
       token VARCHAR2(255) NOT NULL,
       device_info VARCHAR2(255) NOT NULL,
       is_valid VARCHAR2(20) DEFAULT ''ACTIVE'' CHECK (is_valid IN (''ACTIVE'', ''INACTIVE'')),
       expires_at TIMESTAMP NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id)
   )';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF;
END;
/

-- ==========================================
-- 2. DOMINIO CLIMATECT
-- ==========================================
BEGIN
   EXECUTE IMMEDIATE 'CREATE TABLE cliente (
       id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
       tipo_documento VARCHAR2(20) NOT NULL,
       numero_documento VARCHAR2(30) NOT NULL UNIQUE,
       nombre VARCHAR2(150) NOT NULL,
       telefono VARCHAR2(30) NOT NULL,
       email VARCHAR2(150) NOT NULL,
       address VARCHAR2(255) NULL,
       is_active VARCHAR2(20) DEFAULT ''ACTIVE'' CHECK (is_active IN (''ACTIVE'', ''INACTIVE'')),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   )';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF;
END;
/

BEGIN
   EXECUTE IMMEDIATE 'CREATE TABLE equipo (
       id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
       cliente_id NUMBER NOT NULL,
       nombre VARCHAR2(100) NOT NULL,
       descripcion CLOB NULL,
       is_active VARCHAR2(20) DEFAULT ''ACTIVE'' CHECK (is_active IN (''ACTIVE'', ''INACTIVE'')),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       CONSTRAINT fk_equipo_cliente FOREIGN KEY (cliente_id) REFERENCES cliente(id)
   )';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF;
END;
/

BEGIN
   EXECUTE IMMEDIATE 'CREATE TABLE tecnico (
       id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
       nombre VARCHAR2(150) NOT NULL,
       descripcion VARCHAR2(255) NULL,
       is_active VARCHAR2(20) DEFAULT ''ACTIVE'' CHECK (is_active IN (''ACTIVE'', ''INACTIVE'')),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   )';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF;
END;
/

BEGIN
   EXECUTE IMMEDIATE 'CREATE TABLE orden_servicio (
       id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
       cliente_id NUMBER NOT NULL,
       equipo_id NUMBER NOT NULL,
       tecnico_id NUMBER NOT NULL,
       numero VARCHAR2(50) NOT NULL UNIQUE,
       fecha_apertura TIMESTAMP NOT NULL,
       fecha_cierre TIMESTAMP NULL,
       total NUMBER(12,2) DEFAULT 0.00,
       estado VARCHAR2(30) DEFAULT ''ABIERTA'' CHECK (estado IN (''ABIERTA'', ''DIAGNOSTICO'', ''COTIZADA'', ''APROBADA'', ''REPARACION'', ''CERRADA'', ''CANCELADA'')),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       CONSTRAINT fk_os_cliente FOREIGN KEY (cliente_id) REFERENCES cliente(id),
       CONSTRAINT fk_os_equipo FOREIGN KEY (equipo_id) REFERENCES equipo(id),
       CONSTRAINT fk_os_tecnico FOREIGN KEY (tecnico_id) REFERENCES tecnico(id)
   )';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF;
END;
/

BEGIN
   EXECUTE IMMEDIATE 'CREATE TABLE diagnostico (
       id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
       orden_servicio_id NUMBER NOT NULL,
       nombre VARCHAR2(150) NOT NULL,
       descripcion CLOB NOT NULL,
       is_active VARCHAR2(20) DEFAULT ''ACTIVE'' CHECK (is_active IN (''ACTIVE'', ''INACTIVE'')),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       CONSTRAINT fk_diag_os FOREIGN KEY (orden_servicio_id) REFERENCES orden_servicio(id)
   )';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF;
END;
/

BEGIN
   EXECUTE IMMEDIATE 'CREATE TABLE repuesto (
       id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
       nombre VARCHAR2(150) NOT NULL,
       descripcion CLOB NULL,
       precio NUMBER(10,2) NOT NULL,
       stock NUMBER DEFAULT 0 NOT NULL CHECK (stock >= 0),
       is_active VARCHAR2(20) DEFAULT ''ACTIVE'' CHECK (is_active IN (''ACTIVE'', ''INACTIVE'')),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   )';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF;
END;
/

BEGIN
   EXECUTE IMMEDIATE 'CREATE TABLE consumo_repuesto (
       id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
       orden_servicio_id NUMBER NOT NULL,
       repuesto_id NUMBER NOT NULL,
       cantidad NUMBER NOT NULL,
       precio_unitario NUMBER(10,2) NOT NULL,
       is_active VARCHAR2(20) DEFAULT ''ACTIVE'' CHECK (is_active IN (''ACTIVE'', ''INACTIVE'')),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       CONSTRAINT fk_cr_os FOREIGN KEY (orden_servicio_id) REFERENCES orden_servicio(id),
       CONSTRAINT fk_cr_repuesto FOREIGN KEY (repuesto_id) REFERENCES repuesto(id)
   )';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF;
END;
/

BEGIN
   EXECUTE IMMEDIATE 'CREATE TABLE cotizacion (
       id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
       orden_servicio_id NUMBER NOT NULL,
       nombre VARCHAR2(150) NOT NULL,
       descripcion CLOB NULL,
       monto_total NUMBER(12,2) NOT NULL,
       estado VARCHAR2(30) DEFAULT ''PENDIENTE'' CHECK (estado IN (''PENDIENTE'', ''APROBADA'', ''RECHAZADA'')),
       is_active VARCHAR2(20) DEFAULT ''ACTIVE'' CHECK (is_active IN (''ACTIVE'', ''INACTIVE'')),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       CONSTRAINT fk_cot_os FOREIGN KEY (orden_servicio_id) REFERENCES orden_servicio(id)
   )';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF;
END;
/

BEGIN
   EXECUTE IMMEDIATE 'CREATE TABLE pago (
       id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
       referencia_tipo VARCHAR2(50) NOT NULL,
       referencia_id NUMBER NOT NULL,
       orden_servicio_id NUMBER NULL,
       registrado_por_id NUMBER NULL,
       metodo VARCHAR2(50) NOT NULL,
       monto NUMBER(12,2) NOT NULL,
       fecha TIMESTAMP NOT NULL,
       estado VARCHAR2(30) DEFAULT ''COMPLETADO'' CHECK (estado IN (''COMPLETADO'', ''PENDIENTE'', ''ANULADO'')),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       CONSTRAINT fk_pago_orden FOREIGN KEY (orden_servicio_id) REFERENCES orden_servicio(id),
       CONSTRAINT fk_pago_usuario FOREIGN KEY (registrado_por_id) REFERENCES users(id)
   )';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF;
END;
/

BEGIN
   EXECUTE IMMEDIATE 'CREATE TABLE garantia (
       id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
       orden_servicio_id NUMBER NOT NULL UNIQUE,
       nombre VARCHAR2(150) NOT NULL,
       descripcion CLOB NULL,
       fecha_inicio DATE NOT NULL,
       fecha_fin DATE NOT NULL,
       is_active VARCHAR2(20) DEFAULT ''ACTIVE'' CHECK (is_active IN (''ACTIVE'', ''INACTIVE'')),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       CONSTRAINT fk_gar_os FOREIGN KEY (orden_servicio_id) REFERENCES orden_servicio(id)
   )';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF;
END;
/

-- =============================================================================
-- INSERCIÓN DE DATOS DE PRUEBA (DML) - PROYECTO CLIMATECT (ORACLE XE 21c)
-- Asignatura: Base de Datos II
-- Estudiante: Brayan David Arévalo Luna
-- Motor: Oracle Database 21c Express Edition (XEPDB1)
-- =============================================================================

-- 1. Clientes (Los IDs generados automáticamente por IDENTITY serán 2, 3, 4, 5, 6)
INSERT INTO cliente (tipo_documento, numero_documento, nombre, telefono, email) VALUES
('CC', '1065001001', 'Hotel Guajira Real', '3001112233', 'contacto@guajirareal.com');

INSERT INTO cliente (tipo_documento, numero_documento, nombre, telefono, email) VALUES
('NIT', '900123456-1', 'Centro Comercial Viva', '3102223344', 'mantenimiento@viva.com');

INSERT INTO cliente (tipo_documento, numero_documento, nombre, telefono, email) VALUES
('CC', '1065001002', 'Restaurante El Mar', '3203334455', 'admin@elmar.com');

INSERT INTO cliente (tipo_documento, numero_documento, nombre, telefono, email) VALUES
('CC', '1065001003', 'Clinica del Norte', '3014445566', 'biomedica@clinicanorte.com');

INSERT INTO cliente (tipo_documento, numero_documento, nombre, telefono, email) VALUES
('NIT', '800987654-3', 'Supermercado Metro', '3155556677', 'servicios@metro.com');

-- 2. Equipos (Asociados a los clientes con cliente_id: 2 al 6)
INSERT INTO equipo (cliente_id, nombre, descripcion) VALUES
(2, 'Aire Central Chiller 50TR', 'Ubicado en terraza principal del Hotel');

INSERT INTO equipo (cliente_id, nombre, descripcion) VALUES
(2, 'Split 24000 BTU - Recepcion', 'Mantenimiento mensual requerido');

INSERT INTO equipo (cliente_id, nombre, descripcion) VALUES
(3, 'Torre de Enfriamiento B1', 'Planta baja zona comercial');

INSERT INTO equipo (cliente_id, nombre, descripcion) VALUES
(4, 'Cámara Frigorífica Carnes', 'Temperatura de congelación -18C');

INSERT INTO equipo (cliente_id, nombre, descripcion) VALUES
(5, 'Aire Precisión Quirófano 1', 'Filtro HEPA e higrometria controlada');

INSERT INTO equipo (cliente_id, nombre, descripcion) VALUES
(6, 'Cortina de Aire Entrada', 'Sistema de paso continuo');

-- 3. Técnicos (IDs generados: 1, 2, 3, 4)
INSERT INTO tecnico (nombre, descripcion) VALUES
('Brayan Arévalo', 'Técnico Especialista en Refrigeración Industrial');

INSERT INTO tecnico (nombre, descripcion) VALUES
('Carlos Mendoza', 'Técnico de Campo - Climatización Comercial');

INSERT INTO tecnico (nombre, descripcion) VALUES
('Andrés Villamizar', 'Especialista en Diagnóstico Eléctrico');

INSERT INTO tecnico (nombre, descripcion) VALUES
('Diana Marcela Gómez', 'Supervisora de Mantenimiento Preventivo');

-- 4. Repuestos (IDs generados: 1, 2, 3, 4, 5, 6)
INSERT INTO repuesto (nombre, descripcion, precio, stock) VALUES
('Compresor Scroll 5HP', 'Compresor hermético R410A', 1250000.00, 8);

INSERT INTO repuesto (nombre, descripcion, precio, stock) VALUES
('Capacitor de Marcha 45uF', 'Capacitor para motor monofásico', 45000.00, 10);

INSERT INTO repuesto (nombre, descripcion, precio, stock) VALUES
('Gas Refrigerante R410A (Cilindro 11.3kg)', 'Refrigerante ecológico', 380000.00, 8);

INSERT INTO repuesto (nombre, descripcion, precio, stock) VALUES
('Filtro Secador 3/8 Soldable', 'Filtro deshidratador líquido', 65000.00, 9);

INSERT INTO repuesto (nombre, descripcion, precio, stock) VALUES
('Válvula de Expansión Termostática', 'Control de flujo de refrigerante', 210000.00, 10);

INSERT INTO repuesto (nombre, descripcion, precio, stock) VALUES
('Motor Ventilador Condensador 1/3HP', 'Motor de alta eficiencia', 320000.00, 10);

-- 5. Órdenes de Servicio (Asociadas a clientes 2..5, equipos 1..5 y técnicos 1..3)
INSERT INTO orden_servicio (cliente_id, equipo_id, tecnico_id, numero, fecha_apertura, total, estado) VALUES
(2, 1, 1, 'OS-2026-001', TO_TIMESTAMP('2026-08-01 08:30:00', 'YYYY-MM-DD HH24:MI:SS'), 1630000.00, 'CERRADA');

INSERT INTO orden_servicio (cliente_id, equipo_id, tecnico_id, numero, fecha_apertura, total, estado) VALUES
(2, 2, 2, 'OS-2026-002', TO_TIMESTAMP('2026-08-05 10:00:00', 'YYYY-MM-DD HH24:MI:SS'), 445000.00, 'CERRADA');

INSERT INTO orden_servicio (cliente_id, equipo_id, tecnico_id, numero, fecha_apertura, total, estado) VALUES
(3, 3, 1, 'OS-2026-003', TO_TIMESTAMP('2026-08-10 14:15:00', 'YYYY-MM-DD HH24:MI:SS'), 1250000.00, 'REPARACION');

INSERT INTO orden_servicio (cliente_id, equipo_id, tecnico_id, numero, fecha_apertura, total, estado) VALUES
(4, 4, 3, 'OS-2026-004', TO_TIMESTAMP('2026-08-15 09:00:00', 'YYYY-MM-DD HH24:MI:SS'), 210000.00, 'DIAGNOSTICO');

INSERT INTO orden_servicio (cliente_id, equipo_id, tecnico_id, numero, fecha_apertura, total, estado) VALUES
(5, 5, 2, 'OS-2026-005', TO_TIMESTAMP('2026-08-20 11:30:00', 'YYYY-MM-DD HH24:MI:SS'), 0.00, 'ABIERTA');

-- 6. Consumo de Repuestos (Asociados a las órdenes 1, 2 y 3)
INSERT INTO consumo_repuesto (orden_servicio_id, repuesto_id, cantidad, precio_unitario) VALUES
(1, 1, 1, 1250000.00);

INSERT INTO consumo_repuesto (orden_servicio_id, repuesto_id, cantidad, precio_unitario) VALUES
(1, 3, 1, 380000.00);

INSERT INTO consumo_repuesto (orden_servicio_id, repuesto_id, cantidad, precio_unitario) VALUES
(2, 3, 1, 380000.00);

INSERT INTO consumo_repuesto (orden_servicio_id, repuesto_id, cantidad, precio_unitario) VALUES
(2, 4, 1, 65000.00);

INSERT INTO consumo_repuesto (orden_servicio_id, repuesto_id, cantidad, precio_unitario) VALUES
(3, 1, 1, 1250000.00);

-- 7. Diagnósticos (Asociados a las órdenes 1 a 5)
INSERT INTO diagnostico (orden_servicio_id, nombre, descripcion) VALUES
(1, 'Fuga de Gas Refrigerante y Compresor Quemado', 'Se detecta pérdida de presión en tubería principal y falla eléctrica en compresor');

INSERT INTO diagnostico (orden_servicio_id, nombre, descripcion) VALUES
(2, 'Obstrucción en Filtro Secador', 'Filtro deshidratador tapado por impurezas en la línea de líquido');

INSERT INTO diagnostico (orden_servicio_id, nombre, descripcion) VALUES
(3, 'Desgaste en Rodamientos de Ventilador', 'Ruido excesivo y sobrecalentamiento por falta de lubricación');

INSERT INTO diagnostico (orden_servicio_id, nombre, descripcion) VALUES
(4, 'Falla en Tarjeta de Control', 'Sensor de temperatura descalibrado arrojando error de lectura');

INSERT INTO diagnostico (orden_servicio_id, nombre, descripcion) VALUES
(5, 'Revisión General de Rutina', 'Inspección de presiones y limpieza de serpentín condensador');

-- 8. Cotizaciones (Asociadas a las órdenes 1 a 4)
INSERT INTO cotizacion (orden_servicio_id, nombre, descripcion, monto_total, estado) VALUES
(1, 'Cotización Reparación Chiller', 'Incluye cambio de compresor 5HP y recarga de gas R410A', 1630000.00, 'APROBADA');

INSERT INTO cotizacion (orden_servicio_id, nombre, descripcion, monto_total, estado) VALUES
(2, 'Cotización Mantenimiento Correctivo B1', 'Reemplazo de filtro secador y recarga parcial', 445000.00, 'APROBADA');

INSERT INTO cotizacion (orden_servicio_id, nombre, descripcion, monto_total, estado) VALUES
(3, 'Cotización Cambio Compresor Cámara', 'Reemplazo de unidad hermética para refrigeración', 1250000.00, 'PENDIENTE');

INSERT INTO cotizacion (orden_servicio_id, nombre, descripcion, monto_total, estado) VALUES
(4, 'Cotización Diagnóstico Electrónico', 'Reparación de tarjeta principal de control', 210000.00, 'RECHAZADA');

-- 9. Pagos
INSERT INTO pago (referencia_tipo, referencia_id, orden_servicio_id, metodo, monto, fecha, estado) VALUES
('ORDEN_SERVICIO', 1, 1, 'TRANSFERENCIA', 1630000.00, TO_TIMESTAMP('2026-08-02 10:15:00', 'YYYY-MM-DD HH24:MI:SS'), 'COMPLETADO');

INSERT INTO pago (referencia_tipo, referencia_id, orden_servicio_id, metodo, monto, fecha, estado) VALUES
('ORDEN_SERVICIO', 2, 2, 'EFECTIVO', 445000.00, TO_TIMESTAMP('2026-08-06 16:30:00', 'YYYY-MM-DD HH24:MI:SS'), 'COMPLETADO');

INSERT INTO pago (referencia_tipo, referencia_id, orden_servicio_id, metodo, monto, fecha, estado) VALUES
('COTIZACION', 1, 1, 'TARJETA_CREDITO', 500000.00, TO_TIMESTAMP('2026-08-01 11:00:00', 'YYYY-MM-DD HH24:MI:SS'), 'COMPLETADO');

-- 10. Garantías (Asociadas a las órdenes 1 y 2)
INSERT INTO garantia (orden_servicio_id, nombre, descripcion, fecha_inicio, fecha_fin) VALUES
(1, 'Garantía Mantenimiento Chiller 6 Meses', 'Covers fallas de instalación y repuestos reemplazados', TO_DATE('2026-08-02', 'YYYY-MM-DD'), TO_DATE('2027-02-02', 'YYYY-MM-DD'));

INSERT INTO garantia (orden_servicio_id, nombre, descripcion, fecha_inicio, fecha_fin) VALUES
(2, 'Garantía Mantenimiento Preventivo 3 Meses', 'Garantía estándar sobre limpieza y filtro', TO_DATE('2026-08-06', 'YYYY-MM-DD'), TO_DATE('2026-11-06', 'YYYY-MM-DD'));

-- Confirmar la transacción en Oracle
COMMIT;
```

</details>

<details>
<summary>Consultas ? <code>Brayan/scripts/04-oracle/consultas/consultas_climatec.sql</code></summary>

```sql
-- =============================================================================
-- GUÍA DE CONSULTAS Y REPORTES SQL (DML) - CLIMATECT (ORACLE 21c XE)
-- Asignatura: Base de Datos II
-- Estudiante: Brayan David Arévalo Luna
-- Motor: Oracle Database 21c Express Edition (Esquema BRAYAN)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. FILTRADO BÁSICO Y CONDICIONAL (WHERE)
-- -----------------------------------------------------------------------------

-- 1.1 Filtrado por Igualdad / Condición Exacta:
-- Obtener únicamente los clientes cuyo tipo de documento sea Cédula (CC)
SELECT * FROM cliente
WHERE tipo_documento = 'CC';

-- 1.2 Operadores Lógicos (AND, OR, NOT):
-- Buscar órdenes de servicio que estén 'CERRADA' O 'REPARACION'
SELECT * FROM orden_servicio
WHERE estado = 'CERRADA' OR estado = 'REPARACION';

-- 1.3 Búsqueda de Patrones de Texto (Uso de UPPER para Insensibilidad en Oracle):
-- Buscar repuestos que contengan la palabra 'compresor' en su nombre
SELECT * FROM repuesto
WHERE UPPER(nombre) LIKE '%COMPRESOR%';

-- 1.4 Rangos de Valores (BETWEEN con TIMESTAMPS de Oracle):
-- Buscar órdenes abiertas durante el mes de agosto de 2026
SELECT * FROM orden_servicio
WHERE fecha_apertura BETWEEN TO_TIMESTAMP('2026-08-01 00:00:00', 'YYYY-MM-DD HH24:MI:SS')
                         AND TO_TIMESTAMP('2026-08-31 23:59:59', 'YYYY-MM-DD HH24:MI:SS');

-- 1.5 Listas de Opciones (IN):
-- Buscar técnicos con IDs específicos (1, 2, 3)
SELECT * FROM tecnico
WHERE id IN (1, 2, 3);

-- 1.6 Manejo de Valores Nulos (IS NULL / IS NOT NULL):
-- Buscar órdenes que aún no han sido cerradas (fecha_cierre no registrada)
SELECT * FROM orden_servicio
WHERE fecha_cierre IS NULL;


-- -----------------------------------------------------------------------------
-- 2. ORDENAMIENTO DE RESULTADOS (ORDER BY)
-- -----------------------------------------------------------------------------

-- Listar repuestos ordenados desde el más costoso al más barato
SELECT nombre, precio
FROM repuesto
ORDER BY precio DESC;


-- -----------------------------------------------------------------------------
-- 3. AGRUPACIÓN Y FUNCIONES DE AGREGACIÓN (GROUP BY / HAVING)
-- -----------------------------------------------------------------------------

-- 3.1 Agregaciones Básicas (COUNT, SUM, AVG):
-- Contar cuántas órdenes ha atendido cada técnico
SELECT tecnico_id, COUNT(*) AS total_ordenes
FROM orden_servicio
GROUP BY tecnico_id;

-- 3.2 Filtrado sobre Agrupaciones (HAVING):
-- Mostrar solo los técnicos que tengan más de 1 orden asignada
SELECT tecnico_id, COUNT(*) AS total_ordenes
FROM orden_servicio
GROUP BY tecnico_id
HAVING COUNT(*) > 1;


-- -----------------------------------------------------------------------------
-- 4. CONSULTAS MULTITABLA / COMBINACIONES (JOIN)
-- -----------------------------------------------------------------------------

-- 4.1 INNER JOIN (Coincidencia exacta entre tablas):
-- Obtener el nombre del cliente y el equipo que posee
SELECT c.nombre AS cliente, e.nombre AS equipo
FROM equipo e
INNER JOIN cliente c ON e.cliente_id = c.id;

-- 4.2 LEFT JOIN (Inclusión de todos los registros de la izquierda):
-- Mostrar todas las órdenes y sus diagnósticos correspondientes
SELECT os.numero, d.nombre AS diagnostico
FROM orden_servicio os
LEFT JOIN diagnostico d ON d.orden_servicio_id = os.id;


-- -----------------------------------------------------------------------------
-- 5. SUBCONSULTAS (CONSULTAS ANIDADAS)
-- -----------------------------------------------------------------------------

-- Obtener los repuestos cuyo precio sea SUPERIOR al promedio general del catálogo
SELECT nombre, precio
FROM repuesto
WHERE precio > (SELECT AVG(precio) FROM repuesto);


-- -----------------------------------------------------------------------------
-- 6. PAGINACIÓN Y LÍMITES DE RESULTADOS (FETCH FIRST / ROWNUM en Oracle)
-- -----------------------------------------------------------------------------

-- Mostrar únicamente los 3 repuestos más caros (Sintaxis nativa de Oracle 12c+)
SELECT nombre, precio
FROM repuesto
ORDER BY precio DESC
FETCH FIRST 3 ROWS ONLY;


-- -----------------------------------------------------------------------------
-- 7. CONSULTA INTEGRAL DE NEGOCIO (WHERE + JOIN + GROUP BY + HAVING + ORDER BY)
-- -----------------------------------------------------------------------------

-- Calcular el total invertido en repuestos por cliente en órdenes cerradas que superen $500,000
SELECT
    c.nombre AS cliente,
    COUNT(cr.id) AS cantidad_repuestos_usados,
    SUM(cr.cantidad * cr.precio_unitario) AS total_invertido
FROM consumo_repuesto cr
JOIN orden_servicio os ON cr.orden_servicio_id = os.id
JOIN cliente c ON os.cliente_id = c.id
WHERE os.estado = 'CERRADA'
GROUP BY c.id, c.nombre
HAVING SUM(cr.cantidad * cr.precio_unitario) > 500000
ORDER BY total_invertido DESC;
```

</details>

<details>
<summary>Procedimientos ? <code>Brayan/scripts/04-oracle/consultas/sp_climatec.sql</code></summary>

```sql
-- =============================================================================
-- PARTE 1: NARRATIVA, PROCEDIMIENTOS ALMACENADOS PARAMETRIZADOS
-- Y TRIGGERS PARA CLIMATECT (ORACLE DATABASE 21C XE - PL/SQL)
-- Estudiante: Brayan David Arévalo Luna
-- Motor: Oracle Database 21c XE (Esquema BRAYAN)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. SP PARAMETRIZADO: Filtrado de Clientes por Tipo de Documento
-- NARRATIVA: El departamento de atención al cliente requiere obtener la lista
-- de clientes filtrando dinámicamente por tipo de documento (CC, NIT, CE, etc.).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_obtener_clientes_por_tipo_doc(
    p_tipo_doc IN VARCHAR2
) IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR
        SELECT id, nombre, tipo_documento, numero_documento, telefono, email
        FROM cliente
        WHERE tipo_documento = p_tipo_doc;
    DBMS_SQL.RETURN_RESULT(v_cursor);
END;
/

-- -----------------------------------------------------------------------------
-- 2. SP PARAMETRIZADO: Búsqueda de Repuestos por Nombre
-- NARRATIVA: El área de almacén e inventario necesita buscar repuestos mediante
-- un patrón de texto coincidente (insensible a mayúsculas/minúsculas usando UPPER).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_buscar_repuestos_por_nombre(
    p_patron IN VARCHAR2
) IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR
        SELECT id, nombre, descripcion, precio
        FROM repuesto
        WHERE UPPER(nombre) LIKE '%' || UPPER(p_patron) || '%';
    DBMS_SQL.RETURN_RESULT(v_cursor);
END;
/

-- -----------------------------------------------------------------------------
-- 3. SP PARAMETRIZADO: Órdenes de Servicio por Rango de Fechas y Estado
-- NARRATIVA: La gerencia técnica requiere auditar las órdenes de servicio que fueron
-- abiertas dentro de un periodo específico y que coincidan con un estado determinado.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_obtener_ordenes_por_fecha_y_estado(
    p_fecha_inicio IN TIMESTAMP,
    p_fecha_fin IN TIMESTAMP,
    p_estado IN VARCHAR2
) IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR
        SELECT id, numero, fecha_apertura, estado, cliente_id, tecnico_id
        FROM orden_servicio
        WHERE fecha_apertura BETWEEN p_fecha_inicio AND p_fecha_fin
          AND estado = p_estado;
    DBMS_SQL.RETURN_RESULT(v_cursor);
END;
/

-- -----------------------------------------------------------------------------
-- 4. SP PARAMETRIZADO: Conteo de Órdenes Atendidas por Técnico
-- NARRATIVA: El coordinador de personal necesita listar los técnicos que han acumulado
-- un número de órdenes asignadas mayor o igual a un umbral paramétrico.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_tecnicos_con_minimo_ordenes(
    p_minimo_ordenes IN NUMBER
) IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR
        SELECT t.id AS tecnico_id, t.nombre AS tecnico, COUNT(os.id) AS total_ordenes
        FROM tecnico t
        INNER JOIN orden_servicio os ON os.tecnico_id = t.id
        GROUP BY t.id, t.nombre
        HAVING COUNT(os.id) >= p_minimo_ordenes;
    DBMS_SQL.RETURN_RESULT(v_cursor);
END;
/

-- -----------------------------------------------------------------------------
-- 5. SP PARAMETRIZADO: Reporte de Inversión en Repuestos por Cliente
-- NARRATIVA: Informe financiero consolidado de clientes cuya inversión acumulada
-- en repuestos para órdenes cerradas sea mayor o igual a un monto especificado.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_reporte_inversion_repuestos_cliente(
    p_monto_minimo IN NUMBER
) IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR
        SELECT
            c.id AS cliente_id,
            c.nombre AS cliente,
            COUNT(cr.id) AS cantidad_repuestos_usados,
            SUM(cr.cantidad * cr.precio_unitario) AS total_invertido
        FROM consumo_repuesto cr
        INNER JOIN orden_servicio os ON cr.orden_servicio_id = os.id
        INNER JOIN cliente c ON os.cliente_id = c.id
        WHERE os.estado = 'CERRADA'
        GROUP BY c.id, c.nombre
        HAVING SUM(cr.cantidad * cr.precio_unitario) >= p_monto_minimo
        ORDER BY total_invertido DESC;
    DBMS_SQL.RETURN_RESULT(v_cursor);
END;
/

-- -----------------------------------------------------------------------------
-- TRIGGER DE NEGOCIO EN PL/SQL (Auto-cierre de Órdenes de Servicio)
-- NARRATIVA: Cuando una orden cambia a 'CERRADA', el sistema asigna automáticamente
-- la fecha actual en `fecha_cierre` si esta no fue especificada.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_orden_servicio_auto_cierre
BEFORE UPDATE ON orden_servicio
FOR EACH ROW
BEGIN
    IF :NEW.estado = 'CERRADA' AND (:OLD.estado IS NULL OR :OLD.estado <> 'CERRADA') THEN
        IF :NEW.fecha_cierre IS NULL THEN
            :NEW.fecha_cierre := SYSTIMESTAMP;
        END IF;
    END IF;
END;
/
```

</details>

## Despliegue de los motores

Los motores se trabajaron desde **Windows + WSL2/Ubuntu**, con **Docker Compose** y **DBeaver**. Comparten la red Docker `ia-lab-network` y guardan datos en volúmenes persistentes, organizados localmente bajo `~/ia-lab/data/{mysql,postgres,mssql,oracle}`. La dirección IP de WSL puede cambiar al reiniciar; consúltala con `ip a` antes de configurar una conexión remota.

Los archivos Docker Compose se mantienen en el entorno de servicios local, no en este repositorio. Desde la carpeta Compose de cada servicio:

```bash
docker compose up -d
docker ps
docker logs <nombre-del-contenedor> --tail 20
```

Las conexiones se verificaron desde DBeaver en los puertos de la tabla anterior. Para SQL Server se utilizan las herramientas `mssql-tools18`/`sqlcmd`; Oracle se conecta por nombre de servicio/PDB definido en su configuración (no confundir un service name con un SID).

Durante el trabajo se probaron respaldos con las herramientas nativas: `mysqldump` y `pg_dump` producen `.sql`, SQL Server produce `.bak` y Oracle Data Pump produce `.dmp`. Guarda los respaldos fuera del contenedor y comprueba periódicamente su restauración.

> Los nombres de bases y cuentas de las capturas pertenecen a distintas pruebas del curso; la base de la aplicación ClimaTec se configura de forma independiente mediante las variables de entorno de Django.

## Backend Django

El backend está en [`Backend-2026/Django/`](./Backend-2026/Django/). Está desarrollado con Django y Django REST Framework, serializers camelCase, JWT SimpleJWT, permisos RBAC y documentación OpenAPI/Swagger.

| Aplicación | Responsabilidad |
| --- | --- |
| `config` | Configuración, rutas y selección de base de datos por entorno |
| `clients` | Clientes y asociación opcional con cuenta |
| `equipment` | Equipos vinculados a clientes |
| `technicians` | Técnicos |
| `service_orders` | Órdenes, diagnósticos, consumos, cotizaciones y garantías |
| `spare_parts` | Catálogo de repuestos, existencias y disponibilidad |
| `payments` | Pagos vinculados a órdenes |
| `authentication` | Usuarios, roles, recursos, JWT y autorización RBAC |

### Preparar y ejecutar

Ejecuta estos comandos desde Ubuntu/WSL, en la carpeta que contiene `manage.py`. El entorno `.venv` de Linux no debe compartirse con Python de Windows ni reutilizarse tras mover el proyecto.

```bash
cd /home/brayan/ia-lab/projecs/basededatos2/Backend-2026/Django
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

Configura en `.env` una clave `DJANGO_SECRET_KEY` propia, `DB_ENGINE` y los parámetros del motor seleccionado. No publiques `.env`, claves ni contraseñas. Después:

```bash
python manage.py migrate
python manage.py check
python manage.py runserver 127.0.0.1:8000
```

La documentación interactiva queda en [`http://127.0.0.1:8000/api/docs/`](http://127.0.0.1:8000/api/docs/) y el esquema OpenAPI en `/api/schema/`. La raíz `/` puede responder 404; esto no significa que Django esté detenido.

La guía académica ISS-00 fija Python 3.12. El entorno local documentado fue Python 3.14.4 y pasó las comprobaciones del proyecto; queda registrada como una diferencia con la guía.

### API principal

Todas las rutas de recursos están bajo `/api/v1/`, terminan en `/` y entregan campos JSON camelCase.

| Recurso | Rutas |
| --- | --- |
| Clientes | `/clients/` |
| Equipos y técnicos | `/equipment/`, `/technicians/` |
| Órdenes y actividades | `/service-orders/`, `/diagnoses/`, `/spare-part-consumptions/`, `/quotes/`, `/warranties/` |
| Inventario y pagos | `/spare-parts/`, `/spare-parts/available/`, `/payments/` |
| Sesión | `/auth/login/`, `/auth/token/refresh/`, `/auth/logout/`, `/auth/me/`, `/auth/permissions/` |
| Administración RBAC | `/users/`, `/roles/`, `/resources/`, `/role-users/`, `/resource-roles/` |
| Esquema | `/api/schema/`, `/api/docs/` |

`ADMIN` obtiene acceso CRUD de acuerdo con la matriz de rutas y métodos. `CLIENT` tiene permisos de lectura para información asociada explícitamente a su cuenta; no puede escribir, consultar técnicos o consultar el inventario. La autorización se valida en el backend para cada solicitud.

Para crear roles y recursos iniciales, y conceder ADMIN a una cuenta existente elegida explícitamente:

```bash
python manage.py seed_rbac --username TU_USUARIO
```

Sustituye `TU_USUARIO` por el username real. El seeder es idempotente y **no** convierte automáticamente en ADMIN al primer usuario.

### Reglas del dominio

- La existencia se establece desde el saldo físico real del repuesto.
- Registrar un consumo activo valida stock y estado y descuenta unidades en una transacción con bloqueo de fila; cambios, desactivaciones y eliminaciones ajustan o reponen el saldo.
- Un pago no modifica el inventario; el consumo del repuesto sí.
- El cliente se vincula explícitamente a una cuenta, sin asociación automática por correo.
- El login emite access/refresh JWT; la renovación rota el refresh token y el logout lo invalida.
- `HasResourceAccess` autoriza por concesiones de método y ruta. Las rutas de detalle usan `<int:pk>`.

### ISS del backend

La guía de Django describe StoreLab. Las unidades se adaptaron al dominio ClimaTec; los ISS de productos/ventas se implementaron como repuestos/consumos de orden, no como una tienda.

| ISS | Implementación |
| --- | --- |
| 00–01 | Entorno virtual, proyecto Django, variables de entorno y selección del motor de base de datos |
| 02–04 | Aplicaciones del dominio, usuario personalizado y clientes vinculables explícitamente a una cuenta |
| 05–06 | Modelos ClimaTec para equipos, técnicos, órdenes y actividades del servicio |
| 07–10 | DRF, JSON camelCase, API de clientes, catálogo de repuestos y consulta de disponibilidad |
| 11–12 | Operaciones de negocio transaccionales y consulta/gestión de órdenes, adaptadas de los ejercicios de ventas |
| 13–15 | Django Admin, esquema OpenAPI/Swagger y autenticación JWT |
| 16–20 | Modelos RBAC, claims del token, rotación y blacklist del refresh, logout y perfil autenticado |
| 21–25 | Permisos dinámicos por recurso, protección de vistas, CRUD de la matriz RBAC, seeder explícito y pruebas HTTP 401/403 |

El detalle técnico y las capturas de las ISS se conservan en [`Backend-2026/Django/evidencias/05-django/`](./Backend-2026/Django/evidencias/05-django/). Algunas imágenes de productos/ventas son evidencia histórica de una versión intermedia y no representan endpoints actuales.

## Frontend Angular

La aplicación está en [`Frontend-2026/Django/`](./Frontend-2026/Django/). Usa Angular 22 standalone, Signals, routing/lazy loading, PrimeNG 22/Aura, PrimeIcons y Tailwind CSS 4. La interfaz se comunica con Django por el proxy de desarrollo [`proxy.conf.json`](./Frontend-2026/Django/proxy.conf.json).

Para iniciar:

```bash
cd /home/brayan/ia-lab/projecs/basededatos2/Frontend-2026/Django
npm install
npm start
```

Abre `http://localhost:4200/`; el acceso empieza en `/login`. `/demo` contiene una demostración local sin llamadas a la API. La URL del backend se centraliza en `src/app/config/api.config.ts`.

Incluye dashboard con métricas, clientes, equipos, técnicos, repuestos, órdenes y detalle de orden. Los formularios y acciones de escritura se condicionan por los permisos efectivos del usuario; los datos reales se modifican únicamente desde una sesión autorizada.

### Autenticación, permisos y navegación

- Login JWT, refresh rotado, logout remoto, interceptor y guard de sesión.
- Al entrar se cargan en paralelo el perfil y `/auth/permissions/`; un fallo de cualquiera impide marcar la autorización como completa.
- La interfaz compara concesiones efectivas por método y ruta, incluidos IDs numéricos; no toma decisiones de autorización basadas solo en el nombre del rol.
- Las rutas protegidas usan guards y la falta de acceso muestra `/forbidden`.
- La pantalla `/admin/rbac` permite administrar usuarios, roles, recursos, asignaciones usuario-rol y concesiones rol-recurso. Las contraseñas solo se envían al crear un usuario; también se consultan sus permisos efectivos.
- El sidebar inicia oculto en escritorio y móvil. El botón de tres líneas lo abre; seleccionar un destino, pulsar fuera o cerrar el menú lo oculta. Cuando está oculto no recibe foco ni se expone como navegación activa.
- PrimeNG 22 solicita una clave de licencia válida en `providePrimeNG`. La clave no debe escribirse en archivos versionados ni compartirse en GitHub. Al ser una aplicación cliente, cualquier clave necesaria en producción queda accesible en los archivos que descarga el navegador; una variable de compilación evita guardarla en el repositorio, pero no la vuelve secreta para los usuarios. La licencia comunitaria y sus requisitos se consultan en [PrimeUI Community License](https://primeui.dev/licenses/community).

## ISS y validaciones

### Frontend

| Unidad | Resultado |
| --- | --- |
| ISS-00 | Requisitos, herramientas y verificación de la comunicación con la API |
| ISS-01 | Bootstrap Angular y prueba inicial de interfaz |
| ISS-01A–01B | Shell adaptable, menú PrimeNG, navegación y cierre del menú |
| ISS-02 | Tipos de API, configuración común, login JWT e interceptor |
| ISS-03 | Clientes conectados a los campos y endpoints reales de ClimaTec |
| ISS-04 | Tipos de producto no aplican: ClimaTec no tiene esa entidad |
| Módulos de dominio | Equipos y técnicos adaptados a los recursos reales del backend |
| ISS-05 | Productos de la guía adaptados al inventario de repuestos |
| ISS-06 | Ventas de la guía adaptadas a órdenes de servicio |
| ISS-07 | Detalle de orden, diagnósticos, consumos y dashboard |
| ISS-08–09 | Permisos efectivos, guards, rutas, navegación y acciones autorizadas |
| ISS-10 | Administración visual de usuarios, roles, recursos y asignaciones RBAC |
| ISS-11 | Pruebas automatizadas y build de producción |

### Flujo del proyecto y decisiones de adaptación

1. Se diseñó el esquema de ClimaTec y se prepararon scripts específicos para MySQL, PostgreSQL, SQL Server y Oracle; cada motor requiere su propia sintaxis para identidad, rutinas y triggers.
2. Se levantaron los motores en contenedores Docker Compose locales, se validaron conexiones con DBeaver y se guardaron las evidencias y respaldos fuera de los contenedores.
3. Se implementó la API Django y después el frontend Angular, manteniendo las entidades del negocio y el contrato HTTP como referencia para las dos capas.
4. Se recorrieron las ISS de la guía académica, sustituyendo el catálogo/ventas de StoreLab por clientes, equipos, técnicos, repuestos, consumos y órdenes de servicio.
5. Se comprobaron los módulos mediante pruebas, verificaciones de configuración y lecturas con una sesión autorizada; no se ejecutaron escrituras de validación contra registros reales.

Los archivos de Compose y sus credenciales pertenecen al entorno local y no se incluyen en el repositorio. Los directorios de evidencias conservan las capturas originales; este README concentra su explicación para evitar documentación paralela.

### Ejecuciones registradas

Desde `Frontend-2026/Django/`:

```bash
npm test -- --watch=false
npm run build
```

Última verificación registrada el 2026-11-02: **18 archivos de prueba, 76 pruebas aprobadas** y build de producción generado (bundle inicial 855.76 kB; página RBAC en chunk lazy).

Desde `Backend-2026/Django/`:

```bash
./.venv/bin/python manage.py test authentication
```

Última verificación enfocada: **28 pruebas de autenticación/RBAC aprobadas** y comprobación Django sin errores. Las pruebas usan bases temporales; no sustituyen una prueba de escritura contra datos reales.

La interfaz fue verificada con sesión ADMIN para lecturas reales de módulos existentes. Las escrituras de registros reales no se ejecutaron durante las verificaciones documentadas. La pantalla RBAC nueva tiene pruebas automatizadas; su inspección visual con los datos del navegador queda pendiente. En modo desarrollo puede aparecer un aviso de licencia PrimeUI no configurada; no impide compilar.

## Evidencias

Las capturas y sus nombres se mantienen en estas carpetas:

- [MySQL — DDL, GUI, filtros, joins y procedimientos](./Brayan/evidencias/01-mysql/)
- [PostgreSQL — DDL, consultas, funciones y triggers](./Brayan/evidencias/02-postgresql/)
- [SQL Server — DDL, consultas y procedimientos](./Brayan/evidencias/03-sql-server/)
- [Oracle — DDL, consultas, PL/SQL y triggers](./Brayan/evidencias/04-oracle/)
- [Django — ISS-00 a ISS-25](./Backend-2026/Django/evidencias/05-django/)
- [Frontend — login, demo, shell y clientes](./Frontend-2026/Django/evidencias/)

Las capturas de motores documentan creación de esquemas, inserciones, procedimientos/funciones, pruebas de conexión, respaldos y solución de incidencias. Las del frontend incluyen login sin credenciales, demostración local y capturas históricas con datos simulados. Las imágenes de los módulos reales que contienen datos personales no se incorporaron.

## Seguridad y recomendaciones

- No publiques `.env`, claves, contraseñas, tokens ni capturas con datos personales. Los secretos se omiten de esta documentación.
- Usa cuentas de base de datos con privilegios mínimos; no expongas usuarios administrativos ni permisos globales.
- Limita los puertos publicados a las redes necesarias y vuelve a comprobar la IP de WSL si cambia.
- Mantén respaldos fuera de los contenedores y prueba periódicamente su restauración.
- No subas el entorno virtual `.venv`, `node_modules` ni bases locales.
- La herramienta de IA se utilizó como apoyo para resolver problemas y desarrollar; las decisiones se adaptaron al dominio ClimaTec y se contrastaron con pruebas, scripts y el modelo del proyecto.

## Referencias

- [Guía académica de introducción a bases de datos](https://tecnogua.com/academic/site/bd/introduccion/)
- [Instalación de MySQL](https://tecnogua.com/academic/site/bd/instalacion/mysql/)
- [Instalación de PostgreSQL](https://tecnogua.com/academic/site/bd/instalacion/postgresql/)
- [Instalación de Microsoft SQL Server](https://tecnogua.com/academic/site/bd/instalacion/mssql/)
- [Instalación de Oracle XE](https://tecnogua.com/academic/site/bd/instalacion/oracle/)
- [Guía académica de Django/Frontend](https://tecnogua.com/academic/site/frontend2026/django/)
