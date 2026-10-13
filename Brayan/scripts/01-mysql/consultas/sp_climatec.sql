-- =============================================================================
-- PARTE 1: NARRATIVA, CONSULTAS AVANZADAS, PROCEDIMIENTOS ALMACENADOS PARAMETRIZADOS
-- Y TRIGGERS PARA CLIMATECT (MYSQL 8.0)
-- Estudiante: Brayan David Arévalo Luna
-- =============================================================================

USE bd_clima_tec;

DELIMITER //

-- -----------------------------------------------------------------------------
-- 1. CONSULTA / SP PARAMETRIZADO: Filtrado de Clientes por Tipo de Documento
-- NARRATIVA: El departamento de atención al cliente requiere consultar la lista 
-- de clientes filtrando dinámicamente por su tipo de documento (CC, NIT, CE, etc.)
-- para generar reportes segmentados de la base de usuarios.
-- PASO A PASO:
--   1. Se define el procedimiento `sp_obtener_clientes_por_tipo_doc` recibiendo el parámetro `p_tipo_doc`.
--   2. Se ejecuta la consulta `SELECT` sobre la tabla `cliente` filtrando donde `tipo_documento = p_tipo_doc`.
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_obtener_clientes_por_tipo_doc//
CREATE PROCEDURE sp_obtener_clientes_por_tipo_doc(
    IN p_tipo_doc VARCHAR(10)
)
BEGIN
    SELECT id, nombre, tipo_documento, numero_documento, telefono, email 
    FROM cliente 
    WHERE tipo_documento = p_tipo_doc;
END//

-- -----------------------------------------------------------------------------
-- 2. CONSULTA / SP PARAMETRIZADO: Búsqueda de Repuestos por Nombre
-- NARRATIVA: El área de almacén e inventario necesita buscar repuestos mediante 
-- un patrón de texto coincidente (como 'compresor' o 'filtro') para verificar 
-- la disponibilidad, descripción y precio unitario en el catálogo.
-- PASO A PASO:
--   1. Se crea la rutina `sp_buscar_repuestos_por_nombre` aceptando `p_patron`.
--   2. Se utiliza la función `LIKE` concatenada con wildcards `%` sobre la columna `nombre`.
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_buscar_repuestos_por_nombre//
CREATE PROCEDURE sp_buscar_repuestos_por_nombre(
    IN p_patron VARCHAR(100)
)
BEGIN
    SELECT id, nombre, descripcion, precio 
    FROM repuesto 
    WHERE nombre LIKE CONCAT('%', p_patron, '%');
END//

-- -----------------------------------------------------------------------------
-- 3. CONSULTA / SP PARAMETRIZADO: Órdenes de Servicio por Rango de Fechas y Estado
-- NARRATIVA: La gerencia técnica requiere auditar y fiscalizar el flujo de órdenes 
-- de servicio que fueron abiertas dentro de un periodo específico y que coincidan 
-- con un estado operativo determinado ('CERRADA', 'EN_PROCESO', etc.).
-- PASO A PASO:
--   1. Se recibe un rango temporal (`p_fecha_inicio` y `p_fecha_fin`) y el estado (`p_estado`).
--   2. Se filtra con la cláusula `BETWEEN` sobre `fecha_apertura` e igualdad sobre `estado`.
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_obtener_ordenes_por_fecha_y_estado//
CREATE PROCEDURE sp_obtener_ordenes_por_fecha_y_estado(
    IN p_fecha_inicio DATETIME,
    IN p_fecha_fin DATETIME,
    IN p_estado VARCHAR(20)
)
BEGIN
    SELECT id, numero, fecha_apertura, estado, cliente_id, tecnico_id 
    FROM orden_servicio 
    WHERE fecha_apertura BETWEEN p_fecha_inicio AND p_fecha_fin
      AND estado = p_estado;
END//

-- -----------------------------------------------------------------------------
-- 4. CONSULTA / SP PARAMETRIZADO: Conteo de Órdenes Atendidas por Técnico con Filtro
-- NARRATIVA: El coordinador de personal necesita identificar a los técnicos que han 
-- acumulado un número de órdenes asignadas mayor o igual a un umbral paramétrico 
-- para balancear la carga laboral y calcular bonificaciones.
-- PASO A PASO:
--   1. Se realiza un `INNER JOIN` entre la tabla `tecnico` y `orden_servicio`.
--   2. Se agrupa por técnico (`GROUP BY`) y se aplica la restricción de agregación `HAVING COUNT(*) >= p_minimo_ordenes`.
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_tecnicos_con_minimo_ordenes//
CREATE PROCEDURE sp_tecnicos_con_minimo_ordenes(
    IN p_minimo_ordenes INT
)
BEGIN
    SELECT t.id, t.nombre AS tecnico, COUNT(os.id) AS total_ordenes
    FROM tecnico t
    INNER JOIN orden_servicio os ON os.tecnico_id = t.id
    GROUP BY t.id, t.nombre
    HAVING COUNT(os.id) >= p_minimo_ordenes;
END//

-- -----------------------------------------------------------------------------
-- 5. CONSULTA / SP PARAMETRIZADO: Reporte de Inversión en Repuestos por Cliente
-- NARRATIVA: Se requiere un informe financiero consolidado para listar a los clientes 
-- cuya inversión acumulada en repuestos consumidos dentro de órdenes cerradas supere 
-- un monto límite parametrizado.
-- PASO A PASO:
--   1. Se relacionan las entidades `consumo_repuesto`, `orden_servicio` y `cliente` mediante `JOIN`.
--   2. Se filtra por órdenes cerradas (`WHERE os.estado = 'CERRADA'`).
--   3. Se agrupa por cliente calculando el total invertido (`SUM(cantidad * precio_unitario)`) y se filtra con `HAVING >= p_monto_minimo`.
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_reporte_inversion_repuestos_cliente//
CREATE PROCEDURE sp_reporte_inversion_repuestos_cliente(
    IN p_monto_minimo DECIMAL(12,2)
)
BEGIN
    SELECT 
        c.id AS cliente_id,
        c.nombre AS cliente,
        COUNT(cr.id) AS cantidad_repuestos_usados,
        SUM(cr.cantidad * cr.precio_unitario) AS total_invertido
    FROM consumo_repuesto cr
    INNER JOIN orden_servicio os ON cr.orden_servicio_id = os.id
    INNER JOIN cliente c ON os.cliente_id = c.id
    WHERE os.estado = 'CERRADA'
    GROUP BY c.id, c.nombre
    HAVING SUM(cr.cantidad * cr.precio_unitario) >= p_monto_minimo
    ORDER BY total_invertido DESC;
END//

-- -----------------------------------------------------------------------------
-- TRIGGERS (DISPARADORES DE NEGOCIO)
-- -----------------------------------------------------------------------------

-- Trigger 1: Auditoría Automática de Cierre de Órdenes de Servicio
-- NARRATIVA: Para evitar omisiones humanas al cerrar una orden técnica, cuando 
-- una orden pase al estado 'CERRADA', el sistema asignará automáticamente la fecha 
-- y hora actual del servidor en `fecha_cierre` si este campo no fue suministrado.
-- PASO A PASO:
--   1. Se declara un disparador de tipo `BEFORE UPDATE` sobre `orden_servicio`.
--   2. Se valida si el nuevo estado (`NEW.estado`) es 'CERRADA' y difiere del estado anterior (`OLD.estado`).
--   3. En caso afirmativo y si `NEW.fecha_cierre` está nulo, se establece `SET NEW.fecha_cierre = NOW()`.
DROP TRIGGER IF EXISTS trg_orden_servicio_auto_cierre//
CREATE TRIGGER trg_orden_servicio_auto_cierre
BEFORE UPDATE ON orden_servicio
FOR EACH ROW
BEGIN
    IF NEW.estado = 'CERRADA' AND OLD.estado <> 'CERRADA' THEN
        IF NEW.fecha_cierre IS NULL THEN
            SET NEW.fecha_cierre = NOW();
        END IF;
    END IF;
END//

DELIMITER ;
