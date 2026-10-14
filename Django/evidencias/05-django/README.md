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
