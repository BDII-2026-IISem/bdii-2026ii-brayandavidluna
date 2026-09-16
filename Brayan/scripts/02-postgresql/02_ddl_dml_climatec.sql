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

-- INSERCIONES DML DE PRUEBA
INSERT INTO cliente (tipo_documento, numero_documento, nombre, telefono, email) 
VALUES ('CC', '1065234890', 'Hotel Guajira Real', '3009876543', 'mantenimiento@guajirareal.com');

INSERT INTO equipo (cliente_id, nombre, descripcion) 
VALUES (1, 'Aire Acondicionado Central 36000 BTU', 'Ubicado en el salon de eventos principal');

INSERT INTO tecnico (nombre, descripcion) 
VALUES ('Brayan Luna', 'Tecnico certificado en sistemas de refrigeracion');
