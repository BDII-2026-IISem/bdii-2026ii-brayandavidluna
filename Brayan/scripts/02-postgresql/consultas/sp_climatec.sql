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
