# ClimaTec — Base de Datos II

Proyecto académico para el diseño, implementación y documentación de una base de datos para **ClimaTec**, un servicio técnico de refrigeración. El trabajo incluye el modelo relacional y scripts para cuatro motores, además de un backend REST con Django y Django REST Framework.

**Estudiante:** Brayan David Arévalo Luna  
**Docente:** Ing. Jaider Quintero M.  
**Asignatura:** Base de Datos II  
**Periodo:** 2026-II  
**Repositorio:** [BDII-2026-IISem/bdii-2026ii-brayandavidluna](https://github.com/BDII-2026-IISem/bdii-2026ii-brayandavidluna)

## Contenido del proyecto

El dominio de ClimaTec contempla **16 tablas**:

- **Servicio técnico (10):** `cliente`, `equipo`, `tecnico`, `orden_servicio`, `diagnostico`, `repuesto`, `consumo_repuesto`, `cotizacion`, `pago` y `garantia`.
- **Usuarios y autorización RBAC (6):** `users`, `roles`, `role_users`, `resources`, `resource_roles` y `refresh_tokens`.

El inventario corresponde a los repuestos usados en las órdenes de servicio: `repuesto.stock` registra existencias y `consumo_repuesto` registra su uso. Los pagos se relacionan con el servicio y pueden conservar quién los registró. El modelo no incluye ventas de productos comerciales.

## Componentes

### Base de datos en cuatro motores

Se prepararon scripts específicos para:

| Motor | Versión del entorno | Puerto habitual |
| --- | --- | ---: |
| MySQL | 8.0 | 3306 |
| PostgreSQL | 17 | 5432 |
| Microsoft SQL Server | 2022 | 1433 |
| Oracle Database XE | 21c | 1521 |

Los scripts incluyen la definición y carga de datos del esquema, consultas y rutinas adaptadas a cada dialecto. Las evidencias de ejecución se organizan por motor.

### API Django

El backend está en [`Backend-2026/Django/`](./Backend-2026/Django/). Sus aplicaciones cubren clientes, equipos, técnicos, órdenes, repuestos, pagos y autenticación. La API incorpora JWT, autorización RBAC, documentación OpenAPI y Swagger.

Rutas principales:

| Función | Ruta |
| --- | --- |
| Clientes | `/api/v1/clients/` |
| Equipos y técnicos | `/api/v1/equipment/`, `/api/v1/technicians/` |
| Órdenes y actividades de servicio | `/api/v1/service-orders/`, `/api/v1/diagnoses/`, `/api/v1/quotes/`, `/api/v1/warranties/` |
| Repuestos, consumos y pagos | `/api/v1/spare-parts/`, `/api/v1/spare-part-consumptions/`, `/api/v1/payments/` |
| Login, renovación, cierre y perfil | `/api/v1/auth/login/`, `/api/v1/auth/token/refresh/`, `/api/v1/auth/logout/`, `/api/v1/auth/me/` |
| OpenAPI y Swagger | `/api/schema/`, `/api/docs/` |

Las rutas de negocio y el perfil requieren autenticación y permisos RBAC. El inventario se descuenta al registrar el consumo del repuesto en una orden, no al registrar un pago.

## Recorrido del trabajo

1. **Preparación del entorno:** se organizó el repositorio para trabajar desde Windows con WSL2/Ubuntu, Docker y DBeaver.
2. **Motores de bases de datos:** se levantaron y verificaron MySQL, PostgreSQL, SQL Server y Oracle con sus puertos y almacenamiento persistente.
3. **Modelo de ClimaTec:** se definieron las entidades de servicio y de RBAC, sus relaciones y los scripts compatibles con los cuatro dialectos.
4. **Operaciones SQL:** se agregaron datos de prueba, consultas, rutinas y triggers por motor, con evidencias de ejecución.
5. **Backend Django:** se construyó la API REST, se conectó a un motor seleccionado por variables de entorno y se incorporaron JWT, RBAC y Swagger.
6. **Pruebas y documentación:** se documentaron ISS, el flujo de inventario, pagos, ejecución y evidencias. Al retirar las apps comerciales de StoreLab, se conservó como dominio el esquema de servicio técnico ClimaTec.

Como validación del backend se ejecutaron `manage.py check`, la comprobación de migraciones (`makemigrations --check --dry-run`) y la suite de pruebas automatizadas. Las pruebas incluyen autenticación/autorización, configuración del admin e integridad del inventario de repuestos.

## Estructura

```text
basededatos2/
├── Backend-2026/
│   └── Django/              # API, aplicaciones, pruebas y documentación del backend
├── Brayan/
│   ├── scripts/             # SQL organizado por motor
│   ├── evidencias/          # Capturas organizadas por motor
│   ├── README.md            # Guía del trabajo SQL de ClimaTec
│   └── proceso.md           # Desarrollo y documentación del proyecto de bases de datos
└── proceso1.md              # Despliegue y conexión de los motores con Docker y DBeaver
```

La carpeta `Frontend-2026/` está reservada para el frontend; actualmente no contiene archivos versionados.

## Ejecutar el backend

El entorno virtual del proyecto es para **WSL/Linux**. Ejecuta los comandos desde Ubuntu/WSL, en la carpeta que contiene `manage.py`; no reutilices `.venv` desde Windows ni después de mover el proyecto a otra ubicación.

```bash
cd /home/brayan/ia-lab/projecs/basededatos2/Backend-2026/Django
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

Edita `.env`: configura `DJANGO_SECRET_KEY`, selecciona el motor con `DB_ENGINE` y completa las variables de conexión del motor elegido. No subas `.env` ni incluyas credenciales en el repositorio. El motor elegido debe estar iniciado y accesible desde WSL.

```bash
python manage.py migrate
python manage.py check
python manage.py test
python manage.py runserver
```

Abre `http://127.0.0.1:8000/api/docs/` para Swagger. La raíz `/` no tiene una página configurada y puede responder 404 aunque el servidor esté funcionando.

Si tras mover el proyecto ves `(.venv)` pero `python` no se encuentra, recrea el entorno en la ubicación nueva:

```bash
deactivate
python3 -m venv --clear .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

La guía académica de ISS-00 fija Python 3.12. La versión comprobada durante el desarrollo local fue Python 3.14.4; para ajustarse exactamente al requisito del curso, usa Python 3.12.

## Guías y evidencias

- [Desarrollo del backend Django](./Backend-2026/Django/proceso.md): arquitectura, configuración, endpoints, ISS, pruebas y evidencias.
- [Guía del proyecto ClimaTec](./Brayan/README.md): modelo, motores y procedimiento.
- [Proceso de bases de datos](./Brayan/proceso.md): documentación complementaria de SQL.
- [Despliegue de motores](./proceso1.md): contenedores, persistencia, conexiones y respaldos.
- [Evidencias SQL por motor](./Brayan/evidencias/README.md).

## Alcance respecto a la guía Django

La página de ISS de Django del curso describe **StoreLab**, con catálogo de productos y ventas. Este repositorio conserva el dominio ClimaTec; por tanto, el inventario de repuestos y su consumo en órdenes son una adaptación académica y no equivalen literalmente a `ProductType/Product` ni a `Sale/ProductSale`. Las diferencias se detallan en la [documentación del backend](./Backend-2026/Django/proceso.md).
