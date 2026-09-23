-- =============================================================================
-- GUÍA Y REPORTES DE CONSULTAS SQL (DML) - PROYECTO 04: CLIMATECT
-- Asignatura: Base de Datos II
-- Estudiante: Brayan David Arévalo Luna
-- Motor: MySQL 8.0 (bd_clima_tec)
-- =============================================================================

USE bd_clima_tec;

-- 1. FILTRADO BÁSICO Y CONDICIONAL (WHERE)
SELECT * FROM cliente WHERE tipo_documento = 'CC';

SELECT * FROM orden_servicio WHERE estado = 'CERRADA' OR estado = 'REPARACION';

SELECT * FROM repuesto WHERE nombre LIKE '%Compresor%';

SELECT * FROM orden_servicio WHERE fecha_apertura BETWEEN '2026-08-01' AND '2026-08-31';

SELECT * FROM tecnico WHERE id IN (1, 2, 4);

SELECT * FROM orden_servicio WHERE fecha_cierre IS NULL;


-- 2. ORDENAMIENTO DE RESULTADOS (ORDER BY)
SELECT nombre, precio FROM repuesto ORDER BY precio DESC;


-- 3. AGRUPACIÓN Y FUNCIONES DE AGREGACIÓN (GROUP BY / HAVING)
SELECT tecnico_id, COUNT(*) AS total_ordenes FROM orden_servicio GROUP BY tecnico_id;

SELECT tecnico_id, COUNT(*) AS total_ordenes FROM orden_servicio GROUP BY tecnico_id HAVING COUNT(*) > 1;


-- 4. CONSULTAS MULTITABLA (JOIN)
SELECT c.nombre AS cliente, e.nombre AS equipo FROM equipo e INNER JOIN cliente c ON e.cliente_id = c.id;

SELECT os.numero, d.nombre AS diagnostico FROM orden_servicio os LEFT JOIN diagnostico d ON d.orden_servicio_id = os.id;


-- 5. SUBCONSULTAS ANIDADAS
SELECT nombre, precio FROM repuesto WHERE precio > (SELECT AVG(precio) FROM repuesto);


-- 6. PAGINACIÓN Y LÍMITES DE RESULTADOS (LIMIT)
SELECT nombre, precio FROM repuesto ORDER BY precio DESC LIMIT 3;


-- 7. CONSULTA INTEGRAL DE NEGOCIO (WHERE + JOIN + GROUP BY + HAVING + ORDER BY)
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
