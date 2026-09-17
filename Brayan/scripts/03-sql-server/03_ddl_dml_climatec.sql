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
