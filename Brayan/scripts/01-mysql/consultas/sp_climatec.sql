-- =============================================================================
-- PROCEDIMIENTOS ALMACENADOS (STORED PROCEDURES) - CLIMATECT (MYSQL 8.0)
-- Asignatura: Base de Datos II
-- Estudiante: Brayan David Arévalo Luna
-- Motor: MySQL 8.0 (bd_clima_tec)
-- =============================================================================

USE bd_clima_tec;

DELIMITER //

-- -----------------------------------------------------------------------------
-- 1. FILTRADO BÁSICO Y CONDICIONAL (WHERE)
-- -----------------------------------------------------------------------------

-- 1.1 Filtrado por Igualdad / Condición Exacta
DROP PROCEDURE IF EXISTS sp_obtener_clientes_cc//
CREATE PROCEDURE sp_obtener_clientes_cc()
BEGIN
    SELECT * FROM cliente 
    WHERE tipo_documento = 'CC';
END//

-- 1.2 Operadores Lógicos (AND, OR, NOT)
DROP PROCEDURE IF EXISTS sp_obtener_ordenes_cerradas_reparacion//
CREATE PROCEDURE sp_obtener_ordenes_cerradas_reparacion()
BEGIN
    SELECT * FROM orden_servicio 
    WHERE estado = 'CERRADA' OR estado = 'REPARACION';
END//

-- 1.3 Búsqueda de Patrones de Texto (LIKE)
DROP PROCEDURE IF EXISTS sp_buscar_repuesto_compresor//
CREATE PROCEDURE sp_buscar_repuesto_compresor()
BEGIN
    SELECT * FROM repuesto 
    WHERE nombre LIKE '%compresor%';
END//

-- 1.4 Rangos de Valores (BETWEEN)
DROP PROCEDURE IF EXISTS sp_obtener_ordenes_agosto_2026//
CREATE PROCEDURE sp_obtener_ordenes_agosto_2026()
BEGIN
    SELECT * FROM orden_servicio 
    WHERE fecha_apertura BETWEEN '2026-08-01 00:00:00' AND '2026-08-31 23:59:59';
END//

-- 1.5 Listas de Opciones (IN)
DROP PROCEDURE IF EXISTS sp_obtener_tecnicos_especificos//
CREATE PROCEDURE sp_obtener_tecnicos_especificos()
BEGIN
    SELECT * FROM tecnico 
    WHERE id IN (1, 2, 3);
END//

-- 1.6 Manejo de Valores Nulos (IS NULL)
DROP PROCEDURE IF EXISTS sp_obtener_ordenes_sin_cerrar//
CREATE PROCEDURE sp_obtener_ordenes_sin_cerrar()
BEGIN
    SELECT * FROM orden_servicio 
    WHERE fecha_cierre IS NULL;
END//


-- -----------------------------------------------------------------------------
-- 2. ORDENAMIENTO DE RESULTADOS (ORDER BY)
-- -----------------------------------------------------------------------------

DROP PROCEDURE IF EXISTS sp_obtener_repuestos_mas_caros//
CREATE PROCEDURE sp_obtener_repuestos_mas_caros()
BEGIN
    SELECT nombre, precio 
    FROM repuesto 
    ORDER BY precio DESC;
END//


-- -----------------------------------------------------------------------------
-- 3. AGRUPACIÓN Y FUNCIONES DE AGREGACIÓN (GROUP BY / HAVING)
-- -----------------------------------------------------------------------------

-- 3.1 Agregaciones Básicas (COUNT)
DROP PROCEDURE IF EXISTS sp_conteo_ordenes_por_tecnico//
CREATE PROCEDURE sp_conteo_ordenes_por_tecnico()
BEGIN
    SELECT tecnico_id, COUNT(*) AS total_ordenes
    FROM orden_servicio
    GROUP BY tecnico_id;
END//

-- 3.2 Filtrado sobre Agrupaciones (HAVING)
DROP PROCEDURE IF EXISTS sp_tecnicos_mas_de_una_orden//
CREATE PROCEDURE sp_tecnicos_mas_de_una_orden()
BEGIN
    SELECT tecnico_id, COUNT(*) AS total_ordenes
    FROM orden_servicio
    GROUP BY tecnico_id
    HAVING COUNT(*) > 1;
END//


-- -----------------------------------------------------------------------------
-- 4. CONSULTAS MULTITABLA / COMBINACIONES (JOIN)
-- -----------------------------------------------------------------------------

-- 4.1 INNER JOIN
DROP PROCEDURE IF EXISTS sp_obtener_clientes_con_equipos//
CREATE PROCEDURE sp_obtener_clientes_con_equipos()
BEGIN
    SELECT c.nombre AS cliente, e.nombre AS equipo
    FROM equipo e
    INNER JOIN cliente c ON e.cliente_id = c.id;
END//

-- 4.2 LEFT JOIN
DROP PROCEDURE IF EXISTS sp_obtener_ordenes_con_diagnostico//
CREATE PROCEDURE sp_obtener_ordenes_con_diagnostico()
BEGIN
    SELECT os.numero, d.nombre AS diagnostico
    FROM orden_servicio os
    LEFT JOIN diagnostico d ON d.orden_servicio_id = os.id;
END//


-- -----------------------------------------------------------------------------
-- 5. SUBCONSULTAS (CONSULTAS ANIDADAS)
-- -----------------------------------------------------------------------------

DROP PROCEDURE IF EXISTS sp_repuestos_sobre_promedio//
CREATE PROCEDURE sp_repuestos_sobre_promedio()
BEGIN
    SELECT nombre, precio 
    FROM repuesto 
    WHERE precio > (SELECT AVG(precio) FROM repuesto);
END//


-- -----------------------------------------------------------------------------
-- 6. PAGINACIÓN Y LÍMITES DE RESULTADOS (LIMIT)
-- -----------------------------------------------------------------------------

DROP PROCEDURE IF EXISTS sp_top_3_repuestos_costosos//
CREATE PROCEDURE sp_top_3_repuestos_costosos()
BEGIN
    SELECT nombre, precio 
    FROM repuesto 
    ORDER BY precio DESC 
    LIMIT 3;
END//


-- -----------------------------------------------------------------------------
-- 7. CONSULTA INTEGRAL DE NEGOCIO (WHERE + JOIN + GROUP BY + HAVING + ORDER BY)
-- -----------------------------------------------------------------------------

DROP PROCEDURE IF EXISTS sp_reporte_inversion_repuestos_cliente//
CREATE PROCEDURE sp_reporte_inversion_repuestos_cliente()
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
END//

DELIMITER ;
