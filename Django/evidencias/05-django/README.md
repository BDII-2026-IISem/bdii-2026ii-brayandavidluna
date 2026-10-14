# 📸 Evidencias de Backend en Django (Fase I - Business)

**Proyecto:** Proyecto 04 - ClimaTec  
**Asignatura:** Base de Datos II / Backend  
**Estudiante:** Brayan David Arévalo Luna  

---

## 📌 ISS-00: Configuración del Entorno Virtual y Proyecto Base

### 1. Creación del `.venv` e Instalación de Django 5.2.17
![Configuración del entorno virtual](01_iss00_env_setup.png)

### 2. Edición e Inspección del Script `manage.py`
![Inspección de manage.py](02_iss00_manage_py.png)

### 3. Configuración de Importación Modular en `manage.py`
![Configuración de imports](03_iss00_manage_import.png)

### 4. Ajuste del Punto de Entrada `wsgi.py`
![Entrada WSGI](04_iss00_wsgi_setup.png)

---

## 📌 ISS-01: Ajuste de Settings, `.env` y Conexión Dinámica a Base de Datos

### 5. Definición de Variables de Entorno `.env` para MySQL
![Archivo .env](05_iss01_dotenv_mysql.png)

### 6. Diagnóstico y Corrección de Traceback en Migración
![Traceback de migración](06_iss01_traceback_error.png)

### 7. Integración de `database_from_environ()` en `config/settings/__init__.py`
![Settings init](07_iss01_settings_init.png)

### 8. Corrección del Parámetro Opcional en `config/database.py`
![Database py fix](08_iss01_database_py.png)

### 9. Ejecución Exitosa de Migraciones Base (`python manage.py migrate`)
![Migración Exitosa](09_iss01_migrate_ok.png)

---

## ISS-02: Creación y Registro de Aplicaciones del Negocio

### 10. Limpieza de Módulos Conflictivos y Creación de Apps (`clients`, `products`, `sales`)
![Creación de Apps](10_iss02_rm_duplicate_apps.png)

### 11. Registro en `INSTALLED_APPS` y Verificación del Sistema (`python manage.py check`)
![Check de Django Exitoso](11_iss02_settings_check_ok.png)

---

## Puntos de Control ISS-03: Modelo de Usuario Personalizado (CustomUser)

### Error de Conflicto en el Historial de Migraciones
Al definir `AUTH_USER_MODEL = "authentication.CustomUser"` en una base de datos donde ya se habian aplicado las migraciones iniciales de Django (`admin`, `auth`, `contenttypes`), se genera el error `InconsistentMigrationHistory`. Esto ocurre debido a que la tabla `admin.0001_initial` intenta ejecutarse antes de la dependencia del modelo de usuario personalizado.

Para resolver este conflicto, se procedio a limpiar el historial borrando la base de datos `bd_clima_tec` en MySQL y recreandola desde cero para garantizar la ejecucion secuencial limpia.

### Inspeccion de la Base de Datos Limpia bd_clima_tec en DBeaver
![Base de datos limpia en DBeaver](12_iss03_dbeaver_database_clean.png)

### Definicion de CustomUser y Ejecucion Secuencial Exitosa de Migraciones
![Migracion CustomUser Exitosa](13_iss03_customuser_migration_ok.png)
