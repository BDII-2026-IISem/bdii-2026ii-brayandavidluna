-- =============================================================================
-- PROCEDIMIENTOS ALMACENADOS (STORED PROCEDURES) - CLIMATECT (SQL SERVER 2022)
-- Asignatura: Base de Datos II
-- Estudiante: Brayan David Arévalo Luna
-- Motor: MS SQL Server 2022 (bd_clima_tec)
-- =============================================================================

USE bd_clima_tec;

-- 1.1 Filtrado por Cédula
CREATE OR ALTER PROCEDURE sp_obtener_clientes_cc
AS
BEGIN
    SELECT * FROM cliente WHERE tipo_documento = 'CC';
END;

-- 1.2 Órdenes Cerradas o Reparación
CREATE OR ALTER PROCEDURE sp_obtener_ordenes_cerradas_reparacion
AS
BEGIN
    SELECT * FROM orden_servicio WHERE estado = 'CERRADA' OR estado = 'REPARACION';
END;

-- 1.3 Búsqueda por Patrón (LIKE)
CREATE OR ALTER PROCEDURE sp_buscar_repuesto_compresor
AS
BEGIN
    SELECT * FROM repuesto WHERE nombre LIKE '%compresor%';
END;

-- 1.4 Rangos (BETWEEN)
CREATE OR ALTER PROCEDURE sp_obtener_ordenes_agosto_2026
AS
BEGIN
    SELECT * FROM orden_servicio WHERE fecha_apertura BETWEEN '2026-08-01 00:00:00' AND '2026-08-31 23:59:59';
END;

-- 1.5 Listas (IN)
CREATE OR ALTER PROCEDURE sp_obtener_tecnicos_especificos
AS
BEGIN
    SELECT * FROM tecnico WHERE id IN (1, 2, 3);
END;

-- 1.6 Nulos (IS NULL)
CREATE OR ALTER PROCEDURE sp_obtener_ordenes_sin_cerrar
AS
BEGIN
    SELECT * FROM orden_servicio WHERE fecha_cierre IS NULL;
END;

-- 2. Ordenamiento
CREATE OR ALTER PROCEDURE sp_obtener_repuestos_mas_caros
AS
BEGIN
    SELECT nombre, precio FROM repuesto ORDER BY precio DESC;
END;

-- 3.1 Agregación (COUNT)
CREATE OR ALTER PROCEDURE sp_conteo_ordenes_por_tecnico
AS
BEGIN
    SELECT tecnico_id, COUNT(*) AS total_ordenes FROM orden_servicio GROUP BY tecnico_id;
END;

-- 3.2 Filtro HAVING
CREATE OR ALTER PROCEDURE sp_tecnicos_mas_de_una_orden
AS
BEGIN
    SELECT tecnico_id, COUNT(*) AS total_ordenes FROM orden_servicio GROUP BY tecnico_id HAVING COUNT(*) > 1;
END;

-- 4.1 INNER JOIN
CREATE OR ALTER PROCEDURE sp_obtener_clientes_con_equipos
AS
BEGIN
    SELECT c.nombre AS cliente, e.nombre AS equipo FROM equipo e INNER JOIN cliente c ON e.cliente_id = c.id;
END;

-- 4.2 LEFT JOIN
CREATE OR ALTER PROCEDURE sp_obtener_ordenes_con_diagnostico
AS
BEGIN
    SELECT os.numero, d.nombre AS diagnostico FROM orden_servicio os LEFT JOIN diagnostico d ON d.orden_servicio_id = os.id;
END;

-- 5. Subconsulta
CREATE OR ALTER PROCEDURE sp_repuestos_sobre_promedio
AS
BEGIN
    SELECT nombre, precio FROM repuesto WHERE precio > (SELECT AVG(precio) FROM repuesto);
END;

-- 6. Paginación TOP 3
CREATE OR ALTER PROCEDURE sp_top_3_repuestos_costosos
AS
BEGIN
    SELECT TOP 3 nombre, precio FROM repuesto ORDER BY precio DESC;
END;

-- 7. Reporte Consolidado de Negocio
CREATE OR ALTER PROCEDURE sp_reporte_inversion_repuestos_cliente
AS
BEGIN
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
END;
