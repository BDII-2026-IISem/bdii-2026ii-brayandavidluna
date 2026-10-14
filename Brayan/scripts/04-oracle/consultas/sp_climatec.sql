-- =============================================================================
-- PARTE 1: NARRATIVA, PROCEDIMIENTOS ALMACENADOS PARAMETRIZADOS
-- Y TRIGGERS PARA CLIMATECT (ORACLE DATABASE 21C XE - PL/SQL)
-- Estudiante: Brayan David Arévalo Luna
-- Motor: Oracle Database 21c XE (Esquema BRAYAN)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. SP PARAMETRIZADO: Filtrado de Clientes por Tipo de Documento
-- NARRATIVA: El departamento de atención al cliente requiere obtener la lista 
-- de clientes filtrando dinámicamente por tipo de documento (CC, NIT, CE, etc.).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_obtener_clientes_por_tipo_doc(
    p_tipo_doc IN VARCHAR2
) IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR 
        SELECT id, nombre, tipo_documento, numero_documento, telefono, email 
        FROM cliente 
        WHERE tipo_documento = p_tipo_doc;
    DBMS_SQL.RETURN_RESULT(v_cursor);
END;
/

-- -----------------------------------------------------------------------------
-- 2. SP PARAMETRIZADO: Búsqueda de Repuestos por Nombre
-- NARRATIVA: El área de almacén e inventario necesita buscar repuestos mediante 
-- un patrón de texto coincidente (insensible a mayúsculas/minúsculas usando UPPER).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_buscar_repuestos_por_nombre(
    p_patron IN VARCHAR2
) IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR 
        SELECT id, nombre, descripcion, precio 
        FROM repuesto 
        WHERE UPPER(nombre) LIKE '%' || UPPER(p_patron) || '%';
    DBMS_SQL.RETURN_RESULT(v_cursor);
END;
/

-- -----------------------------------------------------------------------------
-- 3. SP PARAMETRIZADO: Órdenes de Servicio por Rango de Fechas y Estado
-- NARRATIVA: La gerencia técnica requiere auditar las órdenes de servicio que fueron 
-- abiertas dentro de un periodo específico y que coincidan con un estado determinado.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_obtener_ordenes_por_fecha_y_estado(
    p_fecha_inicio IN TIMESTAMP,
    p_fecha_fin IN TIMESTAMP,
    p_estado IN VARCHAR2
) IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR 
        SELECT id, numero, fecha_apertura, estado, cliente_id, tecnico_id 
        FROM orden_servicio 
        WHERE fecha_apertura BETWEEN p_fecha_inicio AND p_fecha_fin
          AND estado = p_estado;
    DBMS_SQL.RETURN_RESULT(v_cursor);
END;
/

-- -----------------------------------------------------------------------------
-- 4. SP PARAMETRIZADO: Conteo de Órdenes Atendidas por Técnico
-- NARRATIVA: El coordinador de personal necesita listar los técnicos que han acumulado 
-- un número de órdenes asignadas mayor o igual a un umbral paramétrico.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_tecnicos_con_minimo_ordenes(
    p_minimo_ordenes IN NUMBER
) IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR 
        SELECT t.id AS tecnico_id, t.nombre AS tecnico, COUNT(os.id) AS total_ordenes
        FROM tecnico t
        INNER JOIN orden_servicio os ON os.tecnico_id = t.id
        GROUP BY t.id, t.nombre
        HAVING COUNT(os.id) >= p_minimo_ordenes;
    DBMS_SQL.RETURN_RESULT(v_cursor);
END;
/

-- -----------------------------------------------------------------------------
-- 5. SP PARAMETRIZADO: Reporte de Inversión en Repuestos por Cliente
-- NARRATIVA: Informe financiero consolidado de clientes cuya inversión acumulada 
-- en repuestos para órdenes cerradas sea mayor o igual a un monto especificado.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_reporte_inversion_repuestos_cliente(
    p_monto_minimo IN NUMBER
) IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR 
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
    DBMS_SQL.RETURN_RESULT(v_cursor);
END;
/

-- -----------------------------------------------------------------------------
-- TRIGGER DE NEGOCIO EN PL/SQL (Auto-cierre de Órdenes de Servicio)
-- NARRATIVA: Cuando una orden cambia a 'CERRADA', el sistema asigna automáticamente 
-- la fecha actual en `fecha_cierre` si esta no fue especificada.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_orden_servicio_auto_cierre
BEFORE UPDATE ON orden_servicio
FOR EACH ROW
BEGIN
    IF :NEW.estado = 'CERRADA' AND (:OLD.estado IS NULL OR :OLD.estado <> 'CERRADA') THEN
        IF :NEW.fecha_cierre IS NULL THEN
            :NEW.fecha_cierre := SYSTIMESTAMP;
        END IF;
    END IF;
END;
/
