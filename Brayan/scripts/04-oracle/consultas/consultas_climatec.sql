-- =============================================================================
-- GUÍA DE CONSULTAS Y REPORTES SQL (DML) - CLIMATECT (ORACLE 21c XE)
-- Asignatura: Base de Datos II
-- Estudiante: Brayan David Arévalo Luna
-- Motor: Oracle Database 21c Express Edition (Esquema BRAYAN)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. FILTRADO BÁSICO Y CONDICIONAL (WHERE)
-- -----------------------------------------------------------------------------

-- 1.1 Filtrado por Igualdad / Condición Exacta:
-- Obtener únicamente los clientes cuyo tipo de documento sea Cédula (CC)
SELECT * FROM cliente 
WHERE tipo_documento = 'CC';

-- 1.2 Operadores Lógicos (AND, OR, NOT):
-- Buscar órdenes de servicio que estén 'CERRADA' O 'REPARACION'
SELECT * FROM orden_servicio 
WHERE estado = 'CERRADA' OR estado = 'REPARACION';

-- 1.3 Búsqueda de Patrones de Texto (Uso de UPPER para Insensibilidad en Oracle):
-- Buscar repuestos que contengan la palabra 'compresor' en su nombre
SELECT * FROM repuesto 
WHERE UPPER(nombre) LIKE '%COMPRESOR%';

-- 1.4 Rangos de Valores (BETWEEN con TIMESTAMPS de Oracle):
-- Buscar órdenes abiertas durante el mes de agosto de 2026
SELECT * FROM orden_servicio 
WHERE fecha_apertura BETWEEN TO_TIMESTAMP('2026-08-01 00:00:00', 'YYYY-MM-DD HH24:MI:SS') 
                         AND TO_TIMESTAMP('2026-08-31 23:59:59', 'YYYY-MM-DD HH24:MI:SS');

-- 1.5 Listas de Opciones (IN):
-- Buscar técnicos con IDs específicos (1, 2, 3)
SELECT * FROM tecnico 
WHERE id IN (1, 2, 3);

-- 1.6 Manejo de Valores Nulos (IS NULL / IS NOT NULL):
-- Buscar órdenes que aún no han sido cerradas (fecha_cierre no registrada)
SELECT * FROM orden_servicio 
WHERE fecha_cierre IS NULL;


-- -----------------------------------------------------------------------------
-- 2. ORDENAMIENTO DE RESULTADOS (ORDER BY)
-- -----------------------------------------------------------------------------

-- Listar repuestos ordenados desde el más costoso al más barato
SELECT nombre, precio 
FROM repuesto 
ORDER BY precio DESC;


-- -----------------------------------------------------------------------------
-- 3. AGRUPACIÓN Y FUNCIONES DE AGREGACIÓN (GROUP BY / HAVING)
-- -----------------------------------------------------------------------------

-- 3.1 Agregaciones Básicas (COUNT, SUM, AVG):
-- Contar cuántas órdenes ha atendido cada técnico
SELECT tecnico_id, COUNT(*) AS total_ordenes
FROM orden_servicio
GROUP BY tecnico_id;

-- 3.2 Filtrado sobre Agrupaciones (HAVING):
-- Mostrar solo los técnicos que tengan más de 1 orden asignada
SELECT tecnico_id, COUNT(*) AS total_ordenes
FROM orden_servicio
GROUP BY tecnico_id
HAVING COUNT(*) > 1;


-- -----------------------------------------------------------------------------
-- 4. CONSULTAS MULTITABLA / COMBINACIONES (JOIN)
-- -----------------------------------------------------------------------------

-- 4.1 INNER JOIN (Coincidencia exacta entre tablas):
-- Obtener el nombre del cliente y el equipo que posee
SELECT c.nombre AS cliente, e.nombre AS equipo
FROM equipo e
INNER JOIN cliente c ON e.cliente_id = c.id;

-- 4.2 LEFT JOIN (Inclusión de todos los registros de la izquierda):
-- Mostrar todas las órdenes y sus diagnósticos correspondientes
SELECT os.numero, d.nombre AS diagnostico
FROM orden_servicio os
LEFT JOIN diagnostico d ON d.orden_servicio_id = os.id;


-- -----------------------------------------------------------------------------
-- 5. SUBCONSULTAS (CONSULTAS ANIDADAS)
-- -----------------------------------------------------------------------------

-- Obtener los repuestos cuyo precio sea SUPERIOR al promedio general del catálogo
SELECT nombre, precio 
FROM repuesto 
WHERE precio > (SELECT AVG(precio) FROM repuesto);


-- -----------------------------------------------------------------------------
-- 6. PAGINACIÓN Y LÍMITES DE RESULTADOS (FETCH FIRST / ROWNUM en Oracle)
-- -----------------------------------------------------------------------------

-- Mostrar únicamente los 3 repuestos más caros (Sintaxis nativa de Oracle 12c+)
SELECT nombre, precio 
FROM repuesto 
ORDER BY precio DESC 
FETCH FIRST 3 ROWS ONLY;


-- -----------------------------------------------------------------------------
-- 7. CONSULTA INTEGRAL DE NEGOCIO (WHERE + JOIN + GROUP BY + HAVING + ORDER BY)
-- -----------------------------------------------------------------------------

-- Calcular el total invertido en repuestos por cliente en órdenes cerradas que superen $500,000
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
