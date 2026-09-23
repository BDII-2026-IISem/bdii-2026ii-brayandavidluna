# 📸 Evidencias Completas de Ejecución y Consultas: MySQL (Motor 1)

**Proyecto:** Proyecto 04 - ClimaTec  
**Asignatura:** Base de Datos II  
**Estudiante:** Brayan David Arévalo Luna  
**Motor:** MySQL 8.0 (`bd_clima_tec`)  

---

## 1. Estructura DDL y Tablas del Sistema
Validación de las 16 tablas del sistema (6 RBAC + 10 ClimaTec) creadas correctamente en `bd_clima_tec`.

![Estructura DDL](01_ddl_tablas.png)

---

## 2. Inserción Manual por Interfaz Gráfica (GUI)
* **Borrador de Inserción (Resaltado en verde):** ![GUI Pendiente](02_gui_insercion.png)
* **Registro Guardado (`Ctrl + S`):** ![GUI Guardado](03_gui_insercion.png)

---

## 3. Guía de Consultas SQL (DML) - Ejecución en DBeaver

### 3.1 Filtrado Condicional (`WHERE`)
* **Igualdad Exacta:** ![WHERE CC](04_consulta_where_cc.png)
* **Operadores Lógicos (`OR`):** ![WHERE Estado](05_consulta_where_estado.png)
* **Patrones de Texto (`LIKE`):** ![LIKE Repuestos](06_consulta_like.png)
* **Rangos de Fechas (`BETWEEN`):** ![BETWEEN Fechas](07_consulta_between.png)
* **Listas de Opciones (`IN`):** ![IN Técnicos](08_consulta_in.png)
* **Manejo de Nulos (`IS NULL`):** ![IS NULL Cierre](09_consulta_is_null.png)

---

### 3.2 Ordenamiento (`ORDER BY`)
* **Orden Descendente de Precios:** ![ORDER BY](10_consulta_order_by.png)

---

### 3.3 Agrupaciones y Métricas (`GROUP BY` / `HAVING`)
* **Conteo de Órdenes por Técnico (`GROUP BY`):** ![GROUP BY](11_consulta_group_by.png)
* **Filtrado de Grupos con > 1 Órden (`HAVING`):** ![HAVING](12_consulta_having.png)

---

### 3.4 Uniones Multitabla (`JOIN`)
* **Relación Cliente-Equipo (`INNER JOIN`):** ![INNER JOIN](13_consulta_join_inner.png)
* **Órdenes y Diagnósticos (`LEFT JOIN`):** ![LEFT JOIN](14_consulta_join_left.png)

---

### 3.5 Subconsultas y Límites
* **Repuestos sobre el Precio Promedio:** ![Subconsulta](15_subconsulta.png)
* **Paginación (`LIMIT 3`):** ![LIMIT](16_limit.png)
