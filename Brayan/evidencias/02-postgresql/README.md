# 📘 Evidencias de Implementación y Consultas DML: PostgreSQL 17 (Motor 2)

**Proyecto:** Proyecto 04 - ClimaTec  
**Asignatura:** Base de Datos II  
**Estudiante:** Brayan David Arévalo Luna  

---

## 1. Estructura DDL y Pruebas por Interfaz Gráfica (GUI)

Se desplegaron las 16 tablas correspondientes al modelo RBAC y al dominio ClimaTec dentro del esquema `public` de PostgreSQL.

* **Estructura de Tablas:**  
  ![Tablas Creadas](01_ddl_tablas.png)

* **Prueba GUI (Modo Borrador / Inserción Pendiente):**  
  ![Insercion Borrador](02_gui_insercion.png)

* **Prueba GUI (Confirmación de Transacción / Commit Guardado):**  
  ![Insercion Guardada](03_gui_insercion.png)

---

## 2. Consultas y Reportes DML Avanzados en DBeaver

### 2.1 Filtrado Básico y Condicional (WHERE)
1. **Filtrado por Igualdad Exacta:**  
   ![WHERE Filtrado](04_where_filtrado.png)

2. **Operadores Lógicos (`OR`):**  
   ![WHERE Operadores](05_where_operadores.png)

3. **Búsqueda por Patrón de Texto Insensible a Mayúsculas (`ILIKE`):**  
   ![WHERE ILIKE](06_where_ilike.png)

4. **Rangos de Fechas (`BETWEEN`):**  
   ![WHERE BETWEEN](07_where_between.png)

5. **Lista de Opciones (`IN`):**  
   ![WHERE IN](08_where_in.png)

6. **Manejo de Valores Nulos (`IS NULL`):**  
   ![WHERE IS NULL](09_where_is_null.png)

---

### 2.2 Ordenamiento de Resultados
* **Ordenamiento Descendente de Precios (`ORDER BY DESC`):**  
  ![ORDER BY](10_order_by.png)

---

### 2.3 Agrupación y Funciones de Agregación
1. **Conteo por Técnico (`GROUP BY`):**  
  ![GROUP BY](11_group_by.png)

2. **Filtro sobre Agregaciones (`HAVING`):**  
  ![HAVING](12_having.png)

---

### 2.4 Combinaciones Multitabla (JOIN)
1. **Coincidencia Exacta (`INNER JOIN`):**  
  ![INNER JOIN](13_join_inner.png)

2. **Inclusión Total de la Izquierda (`LEFT JOIN`):**  
  ![LEFT JOIN](14_join_left.png)

---

### 2.5 Subconsultas y Paginación
1. **Subconsulta Anidada sobre Promedio (`AVG`):**  
  ![Subconsulta](15_subconsulta.png)

2. **Paginación de Resultados (`LIMIT`):**  
  ![LIMIT](16_limit.png)

---

### 2.6 Reporte Integrador de Negocio
* **Consulta Consolidada (`JOIN` + `GROUP BY` + `HAVING` + `ORDER BY`):**  
  ![Consulta Negocio](17_consulta_negocio.png)
