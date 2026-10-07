# Evidencias de Ejecución: Rutinas y Procedimientos en PostgreSQL 17

**Asignatura:** Base de Datos II  
**Estudiante:** Brayan David Arévalo Luna  
**Proyecto:** Proyecto 04 - ClimaTec  
**Motor:** PostgreSQL 17 (`postgres` / `bd_clima_tec`)  

---

## Documentación de Invocaciones (SELECT) y Resultados en DBeaver

Este documento relaciona de manera cronológica las 14 funciones/procedimientos almacenados creados en PostgreSQL 17, detallando la sintaxis de invocación y enlazando la captura de pantalla correspondiente con la grilla de resultados obtenida en DBeaver.

---

### 1. Filtrado Básico y Condicional (WHERE)

#### 1.1 Filtrado por Cédula (CC)
* **Función/Procedimiento:** `sp_obtener_clientes_cc_fn`
* **Invocación SQL:** `SELECT * FROM sp_obtener_clientes_cc_fn();`
* **Resultado:** Recupera los clientes registrados en la tabla cuyo tipo de documento es Cédula de Ciudadanía (`CC`).

![Resultados sp_obtener_clientes_cc_fn](Captura%20de%20pantalla%202026-10-06%20224827.png)

---

#### 1.2 Órdenes Cerradas o en Reparación
* **Función/Procedimiento:** `sp_obtener_ordenes_cerradas_reparacion`
* **Invocación SQL:** `SELECT * FROM sp_obtener_ordenes_cerradas_reparacion();`
* **Resultado:** Consulta condicional con operador `OR` que filtra las órdenes de servicio en estado 'CERRADA' o 'REPARACION'.

![Resultados sp_obtener_ordenes_cerradas_reparacion](Captura%20de%20pantalla%202026-10-06%20224921.png)

---

#### 1.3 Búsqueda por Patrón de Texto (ILIKE)
* **Función/Procedimiento:** `sp_buscar_repuesto_compresor`
* **Invocación SQL:** `SELECT * FROM sp_buscar_repuesto_compresor();`
* **Resultado:** Búsqueda insensible a mayúsculas/minúsculas que recupera los repuestos que coinciden con el patrón 'compresor'.

![Resultados sp_buscar_repuesto_compresor](Captura%20de%20pantalla%202026-10-06%20225009.png)

---

#### 1.4 Rangos de Fechas (BETWEEN)
* **Función/Procedimiento:** `sp_obtener_ordenes_agosto_2026`
* **Invocación SQL:** `SELECT * FROM sp_obtener_ordenes_agosto_2026();`
* **Resultado:** Retorna las órdenes registradas en la base de datos dentro del rango de fechas del mes de agosto de 2026.

![Resultados sp_obtener_ordenes_agosto_2026](Captura%20de%20pantalla%202026-10-06%20225049.png)

---

#### 1.5 Listas de Opciones (IN)
* **Función/Procedimiento:** `sp_obtener_tecnicos_especificos`
* **Invocación SQL:** `SELECT * FROM sp_obtener_tecnicos_especificos();`
* **Resultado:** Filtra los registros de la entidad técnico para los identificadores (1, 2, 3).

![Resultados sp_obtener_tecnicos_especificos](Captura%20de%20pantalla%202026-10-06%20225108.png)

---

#### 1.6 Manejo de Valores Nulos (IS NULL)
* **Función/Procedimiento:** `sp_obtener_ordenes_sin_cerrar`
* **Invocación SQL:** `SELECT * FROM sp_obtener_ordenes_sin_cerrar();`
* **Resultado:** Identifica y despliega las órdenes de servicio activas cuya fecha de cierre permanece sin asignar (`NULL`).

![Resultados sp_obtener_ordenes_sin_cerrar](Captura%20de%20pantalla%202026-10-06%20225120.png)

---

### 2. Ordenamiento de Resultados (ORDER BY)

* **Función/Procedimiento:** `sp_obtener_repuestos_mas_caros`
* **Invocación SQL:** `SELECT * FROM sp_obtener_repuestos_mas_caros();`
* **Resultado:** Presenta el catálogo de repuestos ordenado descendentemente por su valor unitario.

![Resultados sp_obtener_repuestos_mas_caros](Captura%20de%20pantalla%202026-10-06%20225131.png)

---

### 3. Agrupación y Funciones de Agregación (GROUP BY / HAVING)

#### 3.1 Conteo de Órdenes por Técnico
* **Función/Procedimiento:** `sp_conteo_ordenes_por_tecnico`
* **Invocación SQL:** `SELECT * FROM sp_conteo_ordenes_por_tecnico();`
* **Resultado:** Agrupa las órdenes atendidas asociándolas a cada técnico y calculando el número total de servicios.

![Resultados sp_conteo_ordenes_por_tecnico](Captura%20de%20pantalla%202026-10-06%20225143.png)

---

#### 3.2 Filtro HAVING sobre Agregaciones
* **Función/Procedimiento:** `sp_tecnicos_mas_de_una_orden`
* **Invocación SQL:** `SELECT * FROM sp_tecnicos_mas_de_una_orden();`
* **Resultado:** Retorna únicamente aquellos técnicos que registran una cantidad estrictamente mayor a 1 orden de servicio.

![Resultados sp_tecnicos_mas_de_una_orden](Captura%20de%20pantalla%202026-10-06%20225201.png)

---

### 4. Combinaciones Multitabla (JOIN)

#### 4.1 Asociación Cliente - Equipo (INNER JOIN)
* **Función/Procedimiento:** `sp_obtener_clientes_con_equipos`
* **Invocación SQL:** `SELECT * FROM sp_obtener_clientes_con_equipos();`
* **Resultado:** Realiza la combinación de tablas para asociar los equipos de refrigeración con los nombres de sus dueños.

![Resultados sp_obtener_clientes_con_equipos](Captura%20de%20pantalla%202026-10-06%20225212.png)

---

#### 4.2 Órdenes y Diagnósticos (LEFT JOIN)
* **Función/Procedimiento:** `sp_obtener_ordenes_con_diagnostico`
* **Invocación SQL:** `SELECT * FROM sp_obtener_ordenes_con_diagnostico();`
* **Resultado:** Despliega todas las órdenes junto con sus diagnósticos, preservando la información general de la orden.

![Resultados sp_obtener_ordenes_con_diagnostico](Captura%20de%20pantalla%202026-10-06%20225225.png)

---

### 5. Subconsultas y Paginación

#### 5.1 Repuestos sobre el Promedio Generado
* **Función/Procedimiento:** `sp_repuestos_sobre_promedio`
* **Invocación SQL:** `SELECT * FROM sp_repuestos_sobre_promedio();`
* **Resultado:** Compara el precio de cada repuesto contra el promedio general calculado dinámicamente.

![Resultados sp_repuestos_sobre_promedio](Captura%20de%20pantalla%202026-10-06%20225242.png)

---

#### 5.2 Paginación Top 3
* **Función/Procedimiento:** `sp_top_3_repuestos_costosos`
* **Invocación SQL:** `SELECT * FROM sp_top_3_repuestos_costosos();`
* **Resultado:** Restringe la respuesta mediante la cláusula `LIMIT 3` devolviendo los insumos de mayor costo.

![Resultados sp_top_3_repuestos_costosos](Captura%20de%20pantalla%202026-10-06%20225254.png)

---

### 6. Consulta Consolidada de Negocio

* **Función/Procedimiento:** `sp_reporte_inversion_repuestos_cliente`
* **Invocación SQL:** `SELECT * FROM sp_reporte_inversion_repuestos_cliente();`
* **Resultado:** Genera la liquidación consolidada por cliente involucrando órdenes cerradas y costos totales consumidos.

![Resultados sp_reporte_inversion_repuestos_cliente](Captura%20de%20pantalla%202026-10-06%20225306.png)
