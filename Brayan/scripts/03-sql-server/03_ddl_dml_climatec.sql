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
    metodo NVARCHAR(50) NOT NULL,
    monto DECIMAL(12,2) NOT NULL,
    fecha DATETIME2 NOT NULL,
    estado NVARCHAR(30) DEFAULT 'COMPLETADO' CHECK (estado IN ('COMPLETADO', 'PENDIENTE', 'ANULADO')),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
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
INSERT INTO repuesto (nombre, descripcion, precio) VALUES
('Compresor Scroll 5HP', 'Compresor hermético R410A', 1250000.00),
('Capacitor de Marcha 45uF', 'Capacitor para motor monofásico', 45000.00),
('Gas Refrigerante R410A (Cilindro 11.3kg)', 'Refrigerante ecológico', 380000.00),
('Filtro Secador 3/8 Soldable', 'Filtro deshidratador líquido', 65000.00),
('Válvula de Expansión Termostática', 'Control de flujo de refrigerante', 210000.00),
('Motor Ventilador Condensador 1/3HP', 'Motor de alta eficiencia', 320000.00);

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
INSERT INTO pago (referencia_tipo, referencia_id, metodo, monto, fecha, estado) VALUES
('ORDEN_SERVICIO', 1, 'TRANSFERENCIA', 1630000.00, '2026-08-02 10:15:00', 'COMPLETADO'),
('ORDEN_SERVICIO', 2, 'EFECTIVO', 445000.00, '2026-08-06 16:30:00', 'COMPLETADO'),
('COTIZACION', 1, 'TARJETA_CREDITO', 500000.00, '2026-08-01 11:00:00', 'COMPLETADO');

-- 10. Garantías (Asociadas a las órdenes 1 y 2)
INSERT INTO garantia (orden_servicio_id, nombre, descripcion, fecha_inicio, fecha_fin) VALUES
(1, 'Garantía Mantenimiento Chiller 6 Meses', 'Covers fallas de instalación y repuestos reemplazados', '2026-08-02', '2027-02-02'),
(2, 'Garantía Mantenimiento Preventivo 3 Meses', 'Garantía estándar sobre limpieza y filtro', '2026-08-06', '2026-11-06');
GO
