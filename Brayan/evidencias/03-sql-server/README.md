# Evidencias de Ejecución: Procedimientos Almacenados en MS SQL Server 2022

**Asignatura:** Base de Datos II  
**Estudiante:** Brayan David Arévalo Luna  
**Proyecto:** Proyecto 04 - ClimaTec  
**Motor:** MS SQL Server 2022 (`bd_clima_tec`)  

---

## Documentación de Invocaciones (EXEC) y Resultados en DBeaver

Este documento relaciona cronológicamente los 14 procedimientos almacenados creados en Microsoft SQL Server 2022, detallando la sintaxis del llamado (`EXEC`) y enlazando la captura de pantalla correspondiente con la grilla de resultados obtenida en DBeaver.

---

### 1. Filtrado Básico y Condicional (WHERE)

#### 1.1 Filtrado por Cédula (CC)
* **Procedimiento:** `sp_obtener_clientes_cc`
* **Invocación SQL:** `EXEC sp_obtener_clientes_cc;`
* **Resultado:** Filtra los registros de clientes cuyo tipo de documento corresponde a Cédula de Ciudadanía (`CC`).

![Resultados EXEC sp_obtener_clientes_cc](Captura%20de%20pantalla%202026-10-08%20165029.png)

---

#### 1.2 Órdenes Cerradas o en Reparación
* **Procedimiento:** `sp_obtener_ordenes_cerradas_reparacion`
* **Invocación SQL:** `EXEC sp_obtener_ordenes_cerradas_reparacion;`
* **Resultado:** Consulta con operador `OR` que retorna las órdenes de servicio en estado 'CERRADA' o 'REPARACION'.

![Resultados EXEC sp_obtener_ordenes_cerradas_reparacion](Captura%20de%20pantalla%202026-10-08%20165040.png)

---

#### 1.3 Búsqueda por Patrón de Texto (LIKE)
* **Procedimiento:** `sp_buscar_repuesto_compresor`
* **Invocación SQL:** `EXEC sp_buscar_repuesto_compresor;`
* **Resultado:** Busca coincidencia de texto parcial devolviendo los repuestos que contienen la palabra 'compresor'.

![Resultados EXEC sp_buscar_repuesto_compresor](Captura%20de%20pantalla%202026-10-08%20165051.png)

---

#### 1.4 Rangos de Fechas (BETWEEN)
* **Procedimiento:** `sp_obtener_ordenes_agosto_2026`
* **Invocación SQL:** `EXEC sp_obtener_ordenes_agosto_2026;`
* **Resultado:** Muestra las órdenes abiertas dentro del rango comprendido entre el 1 y 31 de agosto de 2026.

![Resultados EXEC sp_obtener_ordenes_agosto_2026](Captura%20de%20pantalla%202026-10-08%20165059.png)

---

#### 1.5 Listas de Opciones (IN)
* **Procedimiento:** `sp_obtener_tecnicos_especificos`
* **Invocación SQL:** `EXEC sp_obtener_tecnicos_especificos;`
* **Resultado:** Filtra la entidad técnicos limitándose a los IDs (1, 2, 3).

![Resultados EXEC sp_obtener_tecnicos_especificos](Captura%20de%20pantalla%202026-10-08%20165112.png)

---

#### 1.6 Manejo de Valores Nulos (IS NULL)
* **Procedimiento:** `sp_obtener_ordenes_sin_cerrar`
* **Invocación SQL:** `EXEC sp_obtener_ordenes_sin_cerrar;`
* **Resultado:** Muestra las órdenes de servicio cuya fecha de cierre aún no se ha asignado (`NULL`).

![Resultados EXEC sp_obtener_ordenes_sin_cerrar](Captura%20de%20pantalla%202026-10-08%20165239.png)

---

### 2. Ordenamiento de Resultados (ORDER BY)

* **Procedimiento:** `sp_obtener_repuestos_mas_caros`
* **Invocación SQL:** `EXEC sp_obtener_repuestos_mas_caros;`
* **Resultado:** Retorna el inventario de repuestos ordenado descendentemente según su precio.

![Resultados EXEC sp_obtener_repuestos_mas_caros](Captura%20de%20pantalla%202026-10-08%20165249.png)

---

### 3. Agrupación y Funciones de Agregación (GROUP BY / HAVING)

#### 3.1 Conteo de Órdenes por Técnico
* **Procedimiento:** `sp_conteo_ordenes_por_tecnico`
* **Invocación SQL:** `EXEC sp_conteo_ordenes_por_tecnico;`
* **Resultado:** Agrupa las órdenes de servicio por `tecnico_id` y calcula el total atendido por cada técnico.

![Resultados EXEC sp_conteo_ordenes_por_tecnico](Captura%20de%20pantalla%202026-10-08%20165257.png)

---

#### 3.2 Técnicos con Más de Una Orden Asignada
* **Procedimiento:** `sp_tecnicos_mas_de_una_orden`
* **Invocación SQL:** `EXEC sp_tecnicos_mas_de_una_orden;`
* **Resultado:** Aplica un filtro `HAVING` para mostrar solo los técnicos con un total de órdenes estrictamente mayor a 1.

![Resultados EXEC sp_tecnicos_mas_de_una_orden](Captura%20de%20pantalla%202026-10-08%20165309.png)

---

### 4. Combinaciones Multitabla (JOIN)

#### 4.1 Asociación Cliente - Equipo (INNER JOIN)
* **Procedimiento:** `sp_obtener_clientes_con_equipos`
* **Invocación SQL:** `EXEC sp_obtener_clientes_con_equipos;`
* **Resultado:** Asocia los equipos de refrigeración con el nombre del cliente propietario mediante `INNER JOIN`.

![Resultados EXEC sp_obtener_clientes_con_equipos](Captura%20de%20pantalla%202026-10-08%20165331.png)

---

#### 4.2 Órdenes y Diagnósticos (LEFT JOIN)
* **Procedimiento:** `sp_obtener_ordenes_con_diagnostico`
* **Invocación SQL:** `EXEC sp_obtener_ordenes_con_diagnostico;`
* **Resultado:** Combina todas las órdenes de servicio con sus diagnósticos generados mediante `LEFT JOIN`.

![Resultados EXEC sp_obtener_ordenes_con_diagnostico](Captura%20de%20pantalla%202026-10-08%20165341.png)

---

### 5. Subconsultas y Paginación

#### 5.1 Repuestos sobre el Precio Promedio
* **Procedimiento:** `sp_repuestos_sobre_promedio`
* **Invocación SQL:** `EXEC sp_repuestos_sobre_promedio;`
* **Resultado:** Subconsulta anidada que filtra repuestos cuyo costo supera el valor promedio calculado.

![Resultados EXEC sp_repuestos_sobre_promedio](Captura%20de%20pantalla%202026-10-08%20165400.png)

---

#### 5.2 Paginación TOP 3 Repuestos Costosos
* **Procedimiento:** `sp_top_3_repuestos_costosos`
* **Invocación SQL:** `EXEC sp_top_3_repuestos_costosos;`
* **Resultado:** Retorna únicamente los 3 repuestos más costosos mediante la cláusula `TOP 3` de T-SQL.

![Resultados EXEC sp_top_3_repuestos_costosos](Captura%20de%20pantalla%202026-10-08%20165510.png)

---

### 6. Consulta Consolidada de Negocio

* **Procedimiento:** `sp_reporte_inversion_repuestos_cliente`
* **Invocación SQL:** `EXEC sp_reporte_inversion_repuestos_cliente;`
* **Resultado:** Reporte que consolida la inversión total acumulada en repuestos por cliente para órdenes cerradas.

![Resultados EXEC sp_reporte_inversion_repuestos_cliente](Captura%20de%20pantalla%202026-10-08%20165522.png)
