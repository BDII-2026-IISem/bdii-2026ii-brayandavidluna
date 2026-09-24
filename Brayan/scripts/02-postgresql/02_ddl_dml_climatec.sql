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
INSERT INTO repuesto (nombre, descripcion, precio) VALUES
('Compresor Scroll 5HP', 'Compresor hermético R410A', 1250000.00),
('Capacitor de Marcha 45uF', 'Capacitor para motor monofásico', 45000.00),
('Gas Refrigerante R410A (Cilindro 11.3kg)', 'Refrigerante ecológico', 380000.00),
('Filtro Secador 3/8 Soldable', 'Filtro deshidratador líquido', 65000.00),
('Válvula de Expansión Termostática', 'Control de flujo de refrigerante', 210000.00),
('Motor Ventilador Condensador 1/3HP', 'Motor de alta eficiencia', 320000.00);

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
INSERT INTO pago (referencia_tipo, referencia_id, metodo, monto, fecha, estado) VALUES
('ORDEN_SERVICIO', 6, 'TRANSFERENCIA', 1630000.00, '2026-08-02 10:15:00', 'COMPLETADO'),
('ORDEN_SERVICIO', 7, 'EFECTIVO', 445000.00, '2026-08-06 16:30:00', 'COMPLETADO'),
('COTIZACION', 1, 'TARJETA_CREDITO', 500000.00, '2026-08-01 11:00:00', 'COMPLETADO');

-- 10. Garantías
INSERT INTO garantia (orden_servicio_id, nombre, descripcion, fecha_inicio, fecha_fin) VALUES
(6, 'Garantía Mantenimiento Chiller 6 Meses', 'Cubre fallas de instalación y repuestos reemplazados', '2026-08-02', '2027-02-02'),
(7, 'Garantía Mantenimiento Preventivo 3 Meses', 'Garantía estándar sobre limpieza y filtro', '2026-08-06', '2026-11-06');
