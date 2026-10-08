# Evidencias de Ejecución: Procedimientos Almacenados en Oracle 21c XE

**Asignatura:** Base de Datos II  
**Estudiante:** Brayan David Arévalo Luna  
**Proyecto:** Proyecto 04 - ClimaTec  
**Motor:** Oracle Database 21c XE (`BRAYAN` / `bd_clima_tec`)  

---

## Documentación de Invocaciones (PL/SQL) y Resultados en DBeaver

Este documento relaciona los 14 procedimientos almacenados creados en Oracle 21c XE mediante PL/SQL (`SYS_REFCURSOR` + `DBMS_SQL.RETURN_RESULT`), detallando la sintaxis del llamado y enlazando la captura de pantalla correspondiente con la grilla de resultados obtenida en DBeaver.

---

### 1. Filtrado Básico y Condicional (WHERE)

#### 1.1 Filtrado por Cédula (CC)
* **Procedimiento:** `sp_obtener_clientes_cc`
* **Invocación SQL:** `BEGIN sp_obtener_clientes_cc; END;`
* **Resultado:** Filtra y despliega los clientes cuyo tipo de documento es Cédula de Ciudadanía (`CC`).

![Resultados sp_obtener_clientes_cc](Captura%20de%20pantalla%202026-10-08%20174302.png)

---

#### 1.2 Órdenes Cerradas o en Reparación
* **Procedimiento:** `sp_obtener_ordenes_cerradas_reparacion`
* **Invocación SQL:** `BEGIN sp_obtener_ordenes_cerradas_reparacion; END;`
* **Resultado:** Retorna las órdenes de servicio cuyo estado sea 'CERRADA' o 'REPARACION' aplicando operador lógico `OR`.

![Resultados sp_obtener_ordenes_cerradas_reparacion](Captura%20de%20pantalla%202026-10-08%20174404.png)

---

#### 1.3 Búsqueda por Patrón de Texto (LIKE)
* **Procedimiento:** `sp_buscar_repuesto_compresor`
* **Invocación SQL:** `BEGIN sp_buscar_repuesto_compresor; END;`
* **Resultado:** Búsqueda insensible a mayúsculas/minúsculas sobre la entidad repuesto filtrando por la palabra 'COMPRESOR'.

![Resultados sp_buscar_repuesto_compresor](Captura%20de%20pantalla%202026-10-08%20174438.png)

---

#### 1.4 Rangos de Fechas (BETWEEN con TO_TIMESTAMP)
* **Procedimiento:** `sp_obtener_ordenes_agosto_2026`
* **Invocación SQL:** `BEGIN sp_obtener_ordenes_agosto_2026; END;`
* **Resultado:** Convierte cadenas a tipo Timestamp en PL/SQL para retornar las órdenes aperturadas en agosto de 2026.

![Resultados sp_obtener_ordenes_agosto_2026](Captura%20de%20pantalla%202026-10-08%20174450.png)

---

#### 1.5 Listas de Opciones (IN)
* **Procedimiento:** `sp_obtener_tecnicos_especificos`
* **Invocación SQL:** `BEGIN sp_obtener_tecnicos_especificos; END;`
* **Resultado:** Filtra los registros de técnicos pertenecientes a la lista de identificadores (1, 2, 3).

![Resultados sp_obtener_tecnicos_especificos](Captura%20de%20pantalla%202026-10-08%20174505.png)

---

#### 1.6 Manejo de Valores Nulos (IS NULL)
* **Procedimiento:** `sp_obtener_ordenes_sin_cerrar`
* **Invocación SQL:** `BEGIN sp_obtener_ordenes_sin_cerrar; END;`
* **Resultado:** Muestra las órdenes de servicio activas que no cuentan con fecha de cierre asignada (`NULL`).

![Resultados sp_obtener_ordenes_sin_cerrar](Captura%20de%20pantalla%202026-10-08%20174521.png)

---

### 2. Ordenamiento de Resultados (ORDER BY)

* **Procedimiento:** `sp_obtener_repuestos_mas_caros`
* **Invocación SQL:** `BEGIN sp_obtener_repuestos_mas_caros; END;`
* **Resultado:** Ordena descendentemente el catálogo de repuestos de acuerdo con su costo unitario.

![Resultados sp_obtener_repuestos_mas_caros](Captura%20de%20pantalla%202026-10-08%20174533.png)

---

### 3. Agrupación y Funciones de Agregación (GROUP BY / HAVING)

#### 3.1 Conteo de Órdenes por Técnico
* **Procedimiento:** `sp_conteo_ordenes_por_tecnico`
* **Invocación SQL:** `BEGIN sp_conteo_ordenes_por_tecnico; END;`
* **Resultado:** Realiza un agrupamiento por `tecnico_id` calculando el total de órdenes atendidas por cada profesional.

![Resultados sp_conteo_ordenes_por_tecnico](Captura%20de%20pantalla%202026-10-08%20174544.png)

---

#### 3.2 Filtro HAVING sobre Agregaciones
* **Procedimiento:** `sp_tecnicos_mas_de_una_orden`
* **Invocación SQL:** `BEGIN sp_tecnicos_mas_de_una_orden; END;`
* **Resultado:** Retorna mediante `HAVING` únicamente a aquellos técnicos con más de una orden asignada.

![Resultados sp_tecnicos_mas_de_una_orden](Captura%20de%20pantalla%202026-10-08%20174557.png)

---

### 4. Combinaciones Multitabla (JOIN)

#### 4.1 Asociación Cliente - Equipo (INNER JOIN)
* **Procedimiento:** `sp_obtener_clientes_con_equipos`
* **Invocación SQL:** `BEGIN sp_obtener_clientes_con_equipos; END;`
* **Resultado:** Une las tablas de equipos y clientes para desplegar el dueño de cada sistema de refrigeración.

![Resultados sp_obtener_clientes_con_equipos](Captura%20de%20pantalla%202026-10-08%20174610.png)

---

#### 4.2 Órdenes y Diagnósticos (LEFT JOIN)
* **Procedimiento:** `sp_obtener_ordenes_con_diagnostico`
* **Invocación SQL:** `BEGIN sp_obtener_ordenes_con_diagnostico; END;`
* **Resultado:** Asocia mediante `LEFT JOIN` las órdenes de servicio con sus respectivos diagnósticos técnicos.

![Resultados sp_obtener_ordenes_con_diagnostico](Captura%20de%20pantalla%202026-10-08%20174618.png)

---

### 5. Subconsultas y Paginación

#### 5.1 Repuestos sobre el Promedio Generado
* **Procedimiento:** `sp_repuestos_sobre_promedio`
* **Invocación SQL:** `BEGIN sp_repuestos_sobre_promedio; END;`
* **Resultado:** Subconsulta anidada que compara cada repuesto contra la media de precios del sistema.

![Resultados sp_repuestos_sobre_promedio](Captura%20de%20pantalla%202026-10-08%20174633.png)

---

#### 5.2 Paginación Top 3 Repuestos (FETCH FIRST 3 ROWS ONLY)
* **Procedimiento:** `sp_top_3_repuestos_costosos`
* **Invocación SQL:** `BEGIN sp_top_3_repuestos_costosos; END;`
* **Resultado:** Aplica la sintaxis estándar de Oracle `FETCH FIRST 3 ROWS ONLY` para obtener el Top 3 de insumos de mayor valor.

![Resultados sp_top_3_repuestos_costosos](Captura%20de%20pantalla%202026-10-08%20174640.png)

---

### 6. Consulta Consolidada de Negocio

* **Procedimiento:** `sp_reporte_inversion_repuestos_cliente`
* **Invocación SQL:** `BEGIN sp_reporte_inversion_repuestos_cliente; END;`
* **Resultado:** Consolida la inversión total en repuestos por cliente para órdenes de servicio cerradas.

![Resultados sp_reporte_inversion_repuestos_cliente](Captura%20de%20pantalla%202026-10-08%20174647.png)
