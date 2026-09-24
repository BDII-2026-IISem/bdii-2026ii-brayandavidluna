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
       metodo VARCHAR2(50) NOT NULL,
       monto NUMBER(12,2) NOT NULL,
       fecha TIMESTAMP NOT NULL,
       estado VARCHAR2(30) DEFAULT ''COMPLETADO'' CHECK (estado IN (''COMPLETADO'', ''PENDIENTE'', ''ANULADO'')),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
INSERT INTO repuesto (nombre, descripcion, precio) VALUES
('Compresor Scroll 5HP', 'Compresor hermético R410A', 1250000.00);

INSERT INTO repuesto (nombre, descripcion, precio) VALUES
('Capacitor de Marcha 45uF', 'Capacitor para motor monofásico', 45000.00);

INSERT INTO repuesto (nombre, descripcion, precio) VALUES
('Gas Refrigerante R410A (Cilindro 11.3kg)', 'Refrigerante ecológico', 380000.00);

INSERT INTO repuesto (nombre, descripcion, precio) VALUES
('Filtro Secador 3/8 Soldable', 'Filtro deshidratador líquido', 65000.00);

INSERT INTO repuesto (nombre, descripcion, precio) VALUES
('Válvula de Expansión Termostática', 'Control de flujo de refrigerante', 210000.00);

INSERT INTO repuesto (nombre, descripcion, precio) VALUES
('Motor Ventilador Condensador 1/3HP', 'Motor de alta eficiencia', 320000.00);

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
INSERT INTO pago (referencia_tipo, referencia_id, metodo, monto, fecha, estado) VALUES
('ORDEN_SERVICIO', 1, 'TRANSFERENCIA', 1630000.00, TO_TIMESTAMP('2026-08-02 10:15:00', 'YYYY-MM-DD HH24:MI:SS'), 'COMPLETADO');

INSERT INTO pago (referencia_tipo, referencia_id, metodo, monto, fecha, estado) VALUES
('ORDEN_SERVICIO', 2, 'EFECTIVO', 445000.00, TO_TIMESTAMP('2026-08-06 16:30:00', 'YYYY-MM-DD HH24:MI:SS'), 'COMPLETADO');

INSERT INTO pago (referencia_tipo, referencia_id, metodo, monto, fecha, estado) VALUES
('COTIZACION', 1, 'TARJETA_CREDITO', 500000.00, TO_TIMESTAMP('2026-08-01 11:00:00', 'YYYY-MM-DD HH24:MI:SS'), 'COMPLETADO');

-- 10. Garantías (Asociadas a las órdenes 1 y 2)
INSERT INTO garantia (orden_servicio_id, nombre, descripcion, fecha_inicio, fecha_fin) VALUES
(1, 'Garantía Mantenimiento Chiller 6 Meses', 'Covers fallas de instalación y repuestos reemplazados', TO_DATE('2026-08-02', 'YYYY-MM-DD'), TO_DATE('2027-02-02', 'YYYY-MM-DD'));

INSERT INTO garantia (orden_servicio_id, nombre, descripcion, fecha_inicio, fecha_fin) VALUES
(2, 'Garantía Mantenimiento Preventivo 3 Meses', 'Garantía estándar sobre limpieza y filtro', TO_DATE('2026-08-06', 'YYYY-MM-DD'), TO_DATE('2026-11-06', 'YYYY-MM-DD'));

-- Confirmar la transacción en Oracle
COMMIT;
