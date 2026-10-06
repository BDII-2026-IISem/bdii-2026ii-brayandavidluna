# Evidencias de Ejecucion: Procedimientos Almacenados en MySQL 8.0

**Asignatura:** Base de Datos II  
**Estudiante:** Brayan David Arévalo Luna  
**Proyecto:** Proyecto 04 - ClimaTec  
**Motor:** MySQL 8.0 (`bd_clima_tec`)  

---

## Documentación de Invocaciones (CALL) y Resultados en DBeaver

Este documento relaciona de manera cronológica cada uno de los 14 procedimientos almacenados creados en MySQL 8.0, detallando la sintaxis del llamado (`CALL`) y enlazando la captura de pantalla correspondiente con la grilla de resultados obtenida en DBeaver.

---

### 1. Filtrado Básico y Condicional (WHERE)

#### 1.1 Filtrado por Cédula (CC)
* **Procedimiento:** `sp_obtener_clientes_cc`
* **Invocación SQL:** `CALL sp_obtener_clientes_cc();`
* **Resultado:** Lista los clientes registrados cuyo tipo de documento es Cédula de Ciudadanía (`CC`).

![Resultados CALL sp_obtener_clientes_cc](Captura%20de%20pantalla%202026-10-06%20141948.png)

---

#### 1.2 Órdenes Cerradas o en Reparación
* **Procedimiento:** `sp_obtener_ordenes_cerradas_reparacion`
* **Invocación SQL:** `CALL sp_obtener_ordenes_cerradas_reparacion();`
* **Resultado:** Consulta con operador lógico `OR` que filtra las órdenes de servicio en estado 'CERRADA' o 'REPARACION'.

![Resultados CALL sp_obtener_ordenes_cerradas_reparacion](Captura%20de%20pantalla%202026-10-06%20145836.png)

---

#### 1.3 Búsqueda por Patrón de Texto (LIKE)
* **Procedimiento:** `sp_buscar_repuesto_compresor`
* **Invocación SQL:** `CALL sp_buscar_repuesto_compresor();`
* **Resultado:** Recupera los repuestos cuyo nombre contiene la palabra 'compresor'.

![Resultados CALL sp_buscar_repuesto_compresor](Captura%20de%20pantalla%202026-10-06%20145853.png)

---

#### 1.4 Rangos de Fechas (BETWEEN)
* **Procedimiento:** `sp_obtener_ordenes_agosto_2026`
* **Invocación SQL:** `CALL sp_obtener_ordenes_agosto_2026();`
* **Resultado:** Muestra las órdenes abiertas dentro del rango del 1 al 31 de agosto de 2026.

![Resultados CALL sp_obtener_ordenes_agosto_2026](Captura%20de%20pantalla%202026-10-06%20150159.png)

---

#### 1.5 Listas de Opciones (IN)
* **Procedimiento:** `sp_obtener_tecnicos_especificos`
* **Invocación SQL:** `CALL sp_obtener_tecnicos_especificos();`
* **Resultado:** Obtiene la información de los técnicos cuyos IDs pertenecen al conjunto (1, 2, 3).

![Resultados CALL sp_obtener_tecnicos_especificos](Captura%20de%20pantalla%202026-10-06%20150231.png)

---

#### 1.6 Manejo de Valores Nulos (IS NULL)
* **Procedimiento:** `sp_obtener_ordenes_sin_cerrar`
* **Invocación SQL:** `CALL sp_obtener_ordenes_sin_cerrar();`
* **Resultado:** Muestra las órdenes de servicio que aún no se han cerrado (`fecha_cierre IS NULL`).

![Resultados CALL sp_obtener_ordenes_sin_cerrar](Captura%20de%20pantalla%202026-10-06%20150246.png)

---

### 2. Ordenamiento de Resultados (ORDER BY)

* **Procedimiento:** `sp_obtener_repuestos_mas_caros`
* **Invocación SQL:** `CALL sp_obtener_repuestos_mas_caros();`
* **Resultado:** Lista los repuestos registrados ordenados de forma descendente según su precio.

![Resultados CALL sp_obtener_repuestos_mas_caros](Captura%20de%20pantalla%202026-10-06%20150341.png)

---

### 3. Agrupación y Funciones de Agregación (GROUP BY / HAVING)

#### 3.1 Conteo de Órdenes por Técnico
* **Procedimiento:** `sp_conteo_ordenes_por_tecnico`
* **Invocación SQL:** `CALL sp_conteo_ordenes_por_tecnico();`
* **Resultado:** Agrupa las órdenes de servicio por `tecnico_id` y calcula el total atendido por cada uno.

![Resultados CALL sp_conteo_ordenes_por_tecnico](Captura%20de%20pantalla%202026-10-06%20150356.png)

---

#### 3.2 Técnicos con Más de Una Orden Assigned
* **Procedimiento:** `sp_tecnicos_mas_de_una_orden`
* **Invocación SQL:** `CALL sp_tecnicos_mas_de_una_orden();`
* **Resultado:** Filtra mediante `HAVING` aquellos técnicos que poseen una cantidad de órdenes asignadas mayor a 1.

![Resultados CALL sp_tecnicos_mas_de_una_orden](Captura%20de%20pantalla%202026-10-06%20150413.png)

---

### 4. Combinaciones Multitabla (JOIN)

#### 4.1 Asociación Cliente - Equipo (INNER JOIN)
* **Procedimiento:** `sp_obtener_clientes_con_equipos`
* **Invocación SQL:** `CALL sp_obtener_clientes_con_equipos();`
* **Resultado:** Asocia mediante `INNER JOIN` los equipos registrados con los datos de sus respectivos propietarios.

![Resultados CALL sp_obtener_clientes_con_equipos](Captura%20de%20pantalla%202026-10-06%20150429.png)

---

#### 4.2 Asociación Órdenes y Diagnósticos (LEFT JOIN)
* **Procedimiento:** `sp_obtener_ordenes_con_diagnostico`
* **Invocación SQL:** `CALL sp_obtener_ordenes_con_diagnostico();`
* **Resultado:** Relaciona todas las órdenes de servicio con sus diagnósticos generados, incluyendo aquellas sin diagnóstico aún.

![Resultados CALL sp_obtener_ordenes_con_diagnostico](Captura%20de%20pantalla%202026-10-06%20150629.png)

---

### 5. Subconsultas y Paginación

#### 5.1 Repuestos sobre el Precio Promedio
* **Procedimiento:** `sp_repuestos_sobre_promedio`
* **Invocación SQL:** `CALL sp_repuestos_sobre_promedio();`
* **Resultado:** Utiliza una subconsulta escalar para seleccionar únicamente los repuestos cuyo precio supera el promedio general.

![Resultados CALL sp_repuestos_sobre_promedio](Captura%20de%20pantalla%202026-10-06%20150706.png)

---

#### 5.2 Paginación Top 3 Repuestos
* **Procedimiento:** `sp_top_3_repuestos_costosos`
* **Invocación SQL:** `CALL sp_top_3_repuestos_costosos();`
* **Resultado:** Limita el resultado a los 3 repuestos más costosos mediante la cláusula `LIMIT 3`.

![Resultados CALL sp_top_3_repuestos_costosos](Captura%20de%20pantalla%202026-10-06%20150718.png)

---

### 6. Consulta Consolidada de Negocio

* **Procedimiento:** `sp_reporte_inversion_repuestos_cliente`
* **Invocación SQL:** `CALL sp_reporte_inversion_repuestos_cliente();`
* **Resultado:** Reporte complejo que integra `JOIN`s, agrupaciones, filtros `WHERE` y `HAVING` para calcular la inversión total en repuestos por cliente en órdenes cerradas.

![Resultados CALL sp_reporte_inversion_repuestos_cliente](Captura%20de%20pantalla%202026-10-06%20150751.png)
