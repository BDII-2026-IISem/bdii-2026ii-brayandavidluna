-- =============================================================================
-- PROCEDIMIENTOS ALMACENADOS (STORED PROCEDURES) - CLIMATECT (ORACLE 21c XE)
-- Asignatura: Base de Datos II
-- Estudiante: Brayan David Arévalo Luna
-- Motor: Oracle Database 21c XE (`BRAYAN`)
-- =============================================================================

-- 1. FILTRADO BÁSICO Y CONDICIONAL (WHERE)

-- 1.1 Filtrado por Cédula (CC)
CREATE OR REPLACE PROCEDURE sp_obtener_clientes_cc IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR 
        SELECT * FROM cliente WHERE tipo_documento = 'CC';
    DBMS_SQL.RETURN_RESULT(v_cursor);
END;
/

-- 1.2 Operadores Lógicos (OR)
CREATE OR REPLACE PROCEDURE sp_obtener_ordenes_cerradas_reparacion IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR 
        SELECT * FROM orden_servicio WHERE estado = 'CERRADA' OR estado = 'REPARACION';
    DBMS_SQL.RETURN_RESULT(v_cursor);
END;
/

-- 1.3 Búsqueda de Patrones (LIKE)
CREATE OR REPLACE PROCEDURE sp_buscar_repuesto_compresor IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR 
        SELECT * FROM repuesto WHERE UPPER(nombre) LIKE '%COMPRESOR%';
    DBMS_SQL.RETURN_RESULT(v_cursor);
END;
/

-- 1.4 Rangos de Fechas (BETWEEN con TO_TIMESTAMP)
CREATE OR REPLACE PROCEDURE sp_obtener_ordenes_agosto_2026 IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR 
        SELECT * FROM orden_servicio 
        WHERE fecha_apertura BETWEEN TO_TIMESTAMP('2026-08-01 00:00:00', 'YYYY-MM-DD HH24:MI:SS') 
                                 AND TO_TIMESTAMP('2026-08-31 23:59:59', 'YYYY-MM-DD HH24:MI:SS');
    DBMS_SQL.RETURN_RESULT(v_cursor);
END;
/

-- 1.5 Listas de Opciones (IN)
CREATE OR REPLACE PROCEDURE sp_obtener_tecnicos_especificos IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR 
        SELECT * FROM tecnico WHERE id IN (1, 2, 3);
    DBMS_SQL.RETURN_RESULT(v_cursor);
END;
/

-- 1.6 Manejo de Nulos (IS NULL)
CREATE OR REPLACE PROCEDURE sp_obtener_ordenes_sin_cerrar IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR 
        SELECT * FROM orden_servicio WHERE fecha_cierre IS NULL;
    DBMS_SQL.RETURN_RESULT(v_cursor);
END;
/


-- 2. ORDENAMIENTO DE RESULTADOS (ORDER BY)

CREATE OR REPLACE PROCEDURE sp_obtener_repuestos_mas_caros IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR 
        SELECT nombre, precio FROM repuesto ORDER BY precio DESC;
    DBMS_SQL.RETURN_RESULT(v_cursor);
END;
/


-- 3. AGRUPACIÓN Y FUNCIONES DE AGREGACIÓN (GROUP BY / HAVING)

-- 3.1 Conteo de Órdenes por Técnico
CREATE OR REPLACE PROCEDURE sp_conteo_ordenes_por_tecnico IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR 
        SELECT tecnico_id, COUNT(*) AS total_ordenes FROM orden_servicio GROUP BY tecnico_id;
    DBMS_SQL.RETURN_RESULT(v_cursor);
END;
/

-- 3.2 Filtrado sobre Agrupaciones (HAVING)
CREATE OR REPLACE PROCEDURE sp_tecnicos_mas_de_una_orden IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR 
        SELECT tecnico_id, COUNT(*) AS total_ordenes FROM orden_servicio GROUP BY tecnico_id HAVING COUNT(*) > 1;
    DBMS_SQL.RETURN_RESULT(v_cursor);
END;
/


-- 4. COMBINACIONES MULTITABLA (JOIN)

-- 4.1 INNER JOIN
CREATE OR REPLACE PROCEDURE sp_obtener_clientes_con_equipos IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR 
        SELECT c.nombre AS cliente, e.nombre AS equipo FROM equipo e INNER JOIN cliente c ON e.cliente_id = c.id;
    DBMS_SQL.RETURN_RESULT(v_cursor);
END;
/

-- 4.2 LEFT JOIN
CREATE OR REPLACE PROCEDURE sp_obtener_ordenes_con_diagnostico IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR 
        SELECT os.numero, d.nombre AS diagnostico FROM orden_servicio os LEFT JOIN diagnostico d ON d.orden_servicio_id = os.id;
    DBMS_SQL.RETURN_RESULT(v_cursor);
END;
/


-- 5. SUBCONSULTAS Y PAGINACIÓN

-- 5.1 Subconsulta sobre el Promedio
CREATE OR REPLACE PROCEDURE sp_repuestos_sobre_promedio IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR 
        SELECT nombre, precio FROM repuesto WHERE precio > (SELECT AVG(precio) FROM repuesto);
    DBMS_SQL.RETURN_RESULT(v_cursor);
END;
/

-- 5.2 Top 3 Repuestos Costosos (FETCH FIRST 3 ROWS ONLY)
CREATE OR REPLACE PROCEDURE sp_top_3_repuestos_costosos IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR 
        SELECT nombre, precio FROM repuesto ORDER BY precio DESC FETCH FIRST 3 ROWS ONLY;
    DBMS_SQL.RETURN_RESULT(v_cursor);
END;
/


-- 6. CONSULTA INTEGRAL DE NEGOCIO

CREATE OR REPLACE PROCEDURE sp_reporte_inversion_repuestos_cliente IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR 
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
    DBMS_SQL.RETURN_RESULT(v_cursor);
END;
/
