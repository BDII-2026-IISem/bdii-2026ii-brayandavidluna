# Evidencias de Implementación: PostgreSQL (Motor 2)
**Proyecto:** Proyecto 04 - ClimaTec  
**Asignatura:** Base de Datos II  
**Estudiante:** Brayan David Arévalo Luna  

---

## 1. Implementación DDL (Estructura de Base de Datos)
Se ejecutó el script DDL `02_ddl_dml_climatec.sql` para crear las 16 tablas del sistema dentro del esquema `public`:
- **Modelo RBAC:** `users`, `roles`, `role_users`, `resources`, `resource_roles`, `refresh_tokens`.
- **Dominio ClimaTec:** `cliente`, `equipo`, `tecnico`, `orden_servicio`, `diagnostico`, `repuesto`, `consumo_repuesto`, `cotizacion`, `pago`, `garantia`.

![Estructura DDL y Tablas](01_ddl_tablas.png)

---

## 2. Inserción Manual de Datos por Interfaz Gráfica (GUI)
Se realizó la prueba de inserción manual desde la cuadrícula gráfica de DBeaver sobre la entidad `cliente`:

1. **Borrador de Inserción (Pendiente por Commit):** Fila diligenciada manualmente en la grilla de datos de DBeaver (resaltada en verde).

![Inserción Pendiente GUI](02_gui_insercion.png)

2. **Confirmación de Cambios (Commit Guardado):** Cambios aplicados mediante el botón `Confirmar` (`Ctrl + S`), persistiendo los datos de forma definitiva en la base de datos de PostgreSQL.

![Inserción Confirmada GUI](03_gui_insercion.png)
