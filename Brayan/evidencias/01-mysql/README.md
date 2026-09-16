# Evidencias de Implementación: MySQL (Motor 1)
**Proyecto:** Proyecto 04 - ClimaTec  
**Asignatura:** Base de Datos II  
**Estudiante:** Brayan David Arévalo Luna  

---

## 1. Implementación DDL (Estructura de Base de Datos)
Se ejecutó el script DDL para crear la base de datos `bd_clima_tec`, definiendo sus 16 tablas:
- **Modelo RBAC:** `users`, `roles`, `role_users`, `resources`, `resource_roles`, `refresh_tokens`.
- **Dominio ClimaTec:** `cliente`, `equipo`, `tecnico`, `orden_servicio`, `diagnostico`, `repuesto`, `consumo_repuesto`, `cotizacion`, `pago`, `garantia`.

![Estructura DDL y Tablas](01_ddl_tablas.png)

---

## 2. Inserción Manual de Datos por Interfaz Gráfica (GUI)
Se realizó la prueba de inserción manual desde la cuadrícula gráfica de DBeaver sobre la entidad `cliente`:

1. **Borrador de Inserción (Pendiente por Commit):** Se diligenciaron los datos del nuevo cliente en la grilla antes de aplicar los cambios en la base de datos (resaltado en verde).

![Inserción Pendiente GUI](02_gui_insercion.png)

2. **Confirmación de Cambios (Commit Guardado):** Se aplicó el botón `Confirmar` (`Ctrl + S`) para persistir de manera definitiva el nuevo registro en MySQL.

![Inserción Confirmada GUI](03_gui_insercion.png)
