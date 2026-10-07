-- =============================================================================
-- PROCEDIMIENTOS ALMACENADOS / RUTINAS - CLIMATECT (POSTGRESQL 17)
-- Asignatura: Base de Datos II
-- Estudiante: Brayan David Arévalo Luna
-- Motor: PostgreSQL 17
-- =============================================================================

CREATE OR REPLACE FUNCTION sp_obtener_clientes_cc_fn()
RETURNS SETOF cliente
LANGUAGE sql
AS $$
    SELECT * FROM cliente WHERE tipo_documento = 'CC';
$$;

CREATE OR REPLACE FUNCTION sp_obtener_ordenes_cerradas_reparacion()
RETURNS SETOF orden_servicio
LANGUAGE sql
AS $$
    SELECT * FROM orden_servicio 
    WHERE estado = 'CERRADA' OR estado = 'REPARACION';
$$;

CREATE OR REPLACE FUNCTION sp_buscar_repuesto_compresor()
RETURNS SETOF repuesto
LANGUAGE sql
AS $$
    SELECT * FROM repuesto 
    WHERE nombre ILIKE '%compresor%';
$$;

CREATE OR REPLACE FUNCTION sp_obtener_ordenes_agosto_2026()
RETURNS SETOF orden_servicio
LANGUAGE sql
AS $$
    SELECT * FROM orden_servicio 
    WHERE fecha_apertura BETWEEN '2026-08-01 00:00:00' AND '2026-08-31 23:59:59';
$$;

CREATE OR REPLACE FUNCTION sp_obtener_tecnicos_especificos()
RETURNS SETOF tecnico
LANGUAGE sql
AS $$
    SELECT * FROM tecnico 
    WHERE id IN (1, 2, 3);
$$;

CREATE OR REPLACE FUNCTION sp_obtener_ordenes_sin_cerrar()
RETURNS SETOF orden_servicio
LANGUAGE sql
AS $$
    SELECT * FROM orden_servicio 
    WHERE fecha_cierre IS NULL;
$$;

CREATE OR REPLACE FUNCTION sp_obtener_repuestos_mas_caros()
RETURNS TABLE (nombre VARCHAR, precio DECIMAL)
LANGUAGE sql
AS $$
    SELECT nombre, precio 
    FROM repuesto 
    ORDER BY precio DESC;
$$;

CREATE OR REPLACE FUNCTION sp_conteo_ordenes_por_tecnico()
RETURNS TABLE (tecnico_id INT, total_ordenes BIGINT)
LANGUAGE sql
AS $$
    SELECT tecnico_id, COUNT(*) AS total_ordenes
    FROM orden_servicio
    GROUP BY tecnico_id;
$$;

CREATE OR REPLACE FUNCTION sp_tecnicos_mas_de_una_orden()
RETURNS TABLE (tecnico_id INT, total_ordenes BIGINT)
LANGUAGE sql
AS $$
    SELECT tecnico_id, COUNT(*) AS total_ordenes
    FROM orden_servicio
    GROUP BY tecnico_id
    HAVING COUNT(*) > 1;
$$;

CREATE OR REPLACE FUNCTION sp_obtener_clientes_con_equipos()
RETURNS TABLE (cliente VARCHAR, equipo VARCHAR)
LANGUAGE sql
AS $$
    SELECT c.nombre AS cliente, e.nombre AS equipo
    FROM equipo e
    INNER JOIN cliente c ON e.cliente_id = c.id;
$$;

CREATE OR REPLACE FUNCTION sp_obtener_ordenes_con_diagnostico()
RETURNS TABLE (numero VARCHAR, diagnostico VARCHAR)
LANGUAGE sql
AS $$
    SELECT os.numero, d.nombre AS diagnostico
    FROM orden_servicio os
    LEFT JOIN diagnostico d ON d.orden_servicio_id = os.id;
$$;

CREATE OR REPLACE FUNCTION sp_repuestos_sobre_promedio()
RETURNS TABLE (nombre VARCHAR, precio DECIMAL)
LANGUAGE sql
AS $$
    SELECT nombre, precio 
    FROM repuesto 
    WHERE precio > (SELECT AVG(precio) FROM repuesto);
$$;

CREATE OR REPLACE FUNCTION sp_top_3_repuestos_costosos()
RETURNS TABLE (nombre VARCHAR, precio DECIMAL)
LANGUAGE sql
AS $$
    SELECT nombre, precio 
    FROM repuesto 
    ORDER BY precio DESC 
    LIMIT 3;
$$;

CREATE OR REPLACE FUNCTION sp_reporte_inversion_repuestos_cliente()
RETURNS TABLE (cliente VARCHAR, cantidad_repuestos_usados BIGINT, total_invertido NUMERIC)
LANGUAGE sql
AS $$
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
$$;
