-- =============================================================================
-- PARTE 1: NARRATIVA, PROCEDIMIENTOS ALMACENADOS PARAMETRIZADOS
-- Y TRIGGERS PARA CLIMATECT (MS SQL SERVER 2022 - T-SQL)
-- Estudiante: Brayan David Arévalo Luna
-- Motor: MS SQL Server 2022 (`bd_clima_tec`)
-- =============================================================================

USE bd_clima_tec;
GO

-- -----------------------------------------------------------------------------
-- 1. SP PARAMETRIZADO: Filtrado de Clientes por Tipo de Documento
-- NARRATIVA: El departamento de atención al cliente requiere obtener la lista 
-- de clientes filtrando dinámicamente por tipo de documento (CC, NIT, CE, etc.).
-- -----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_obtener_clientes_por_tipo_doc
    @p_tipo_doc NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, nombre, tipo_documento, numero_documento, telefono, email 
    FROM cliente 
    WHERE tipo_documento = @p_tipo_doc;
END;
GO

-- -----------------------------------------------------------------------------
-- 2. SP PARAMETRIZADO: Búsqueda de Repuestos por Nombre
-- NARRATIVA: El área de almacén e inventario necesita buscar repuestos mediante 
-- un patrón de texto coincidente para verificar disponibilidad y precio unitario.
-- -----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_buscar_repuestos_por_nombre
    @p_patron NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, nombre, descripcion, precio 
    FROM repuesto 
    WHERE nombre LIKE '%' + @p_patron + '%';
END;
GO

-- -----------------------------------------------------------------------------
-- 3. SP PARAMETRIZADO: Órdenes de Servicio por Rango de Fechas y Estado
-- NARRATIVA: La gerencia técnica requiere auditar las órdenes de servicio que fueron 
-- abiertas dentro de un periodo específico y que coincidan con un estado determinado.
-- -----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_obtener_ordenes_por_fecha_y_estado
    @p_fecha_inicio DATETIME2,
    @p_fecha_fin DATETIME2,
    @p_estado NVARCHAR(30)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, numero, fecha_apertura, estado, cliente_id, tecnico_id 
    FROM orden_servicio 
    WHERE fecha_apertura BETWEEN @p_fecha_inicio AND @p_fecha_fin
      AND estado = @p_estado;
END;
GO

-- -----------------------------------------------------------------------------
-- 4. SP PARAMETRIZADO: Conteo de Órdenes Atendidas por Técnico
-- NARRATIVA: El coordinador de personal necesita listar los técnicos que han acumulado 
-- un número de órdenes asignadas mayor o igual a un umbral paramétrico.
-- -----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_tecnicos_con_minimo_ordenes
    @p_minimo_ordenes INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT t.id AS tecnico_id, t.nombre AS tecnico, COUNT(os.id) AS total_ordenes
    FROM tecnico t
    INNER JOIN orden_servicio os ON os.tecnico_id = t.id
    GROUP BY t.id, t.nombre
    HAVING COUNT(os.id) >= @p_minimo_ordenes;
END;
GO

-- -----------------------------------------------------------------------------
-- 5. SP PARAMETRIZADO: Reporte de Inversión en Repuestos por Cliente
-- NARRATIVA: Informe financiero consolidado de clientes cuya inversión acumulada 
-- en repuestos para órdenes cerradas sea mayor o igual a un monto especificado.
-- -----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_reporte_inversion_repuestos_cliente
    @p_monto_minimo DECIMAL(12,2)
AS
BEGIN
    SET NOCOUNT ON;
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
    HAVING SUM(cr.cantidad * cr.precio_unitario) >= @p_monto_minimo
    ORDER BY total_invertido DESC;
END;
GO

-- -----------------------------------------------------------------------------
-- TRIGGER DE NEGOCIO EN T-SQL (Auto-cierre de Órdenes de Servicio)
-- NARRATIVA: Cuando una orden cambia a 'CERRADA', el sistema asigna automáticamente 
-- la fecha actual en `fecha_cierre` si esta no fue especificada.
-- -----------------------------------------------------------------------------
CREATE OR ALTER TRIGGER trg_orden_servicio_auto_cierre
ON orden_servicio
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    IF UPDATE(estado)
    BEGIN
        UPDATE os
        SET fecha_cierre = GETDATE()
        FROM orden_servicio os
        INNER JOIN inserted i ON os.id = i.id
        INNER JOIN deleted d ON os.id = d.id
        WHERE i.estado = 'CERRADA' 
          AND d.estado <> 'CERRADA'
          AND i.fecha_cierre IS NULL;
    END
END;
GO
