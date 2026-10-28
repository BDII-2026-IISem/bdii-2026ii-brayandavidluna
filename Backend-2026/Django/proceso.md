# Proceso de desarrollo — ClimaTec

Backend académico de **ClimaTec**, el sistema de servicio técnico de refrigeración del Proyecto 04, desarrollado para Base de Datos II con Django y Django REST Framework (DRF). La solución gestiona clientes, equipos, técnicos, órdenes de servicio, diagnósticos, repuestos consumidos, cotizaciones, pagos y garantías; también incluye autenticación JWT, autorización RBAC y documentación OpenAPI.

Durante una etapa anterior se agregaron `products` y `sales` para un flujo comercial tipo StoreLab. Al comparar esas apps con el propósito y las tablas originales de ClimaTec, se retiraron: una venta de productos no representa una reparación y el inventario correcto es el de `repuesto`, consumido desde una orden. La migración `spare_parts.0003_remove_storelab_tables` elimina de forma irreversible las tablas comerciales antiguas y los datos que contenían.

**Alcance frente a la guía del docente:** la página de Django describe el ejercicio StoreLab. Esta entrega conserva el dominio ClimaTec por decisión de alcance; por ello, algunos ISS se adaptan y no son equivalentes literales ni satisfacen el modelo `ProductType/Product` y `Sale/ProductSale` de StoreLab. La tabla de la sección 4 documenta esas diferencias para no presentar las adaptaciones como cumplimiento exacto.

**Estudiante:** Brayan David Arévalo Luna

**Docente:** Ing. Jaider Quintero M.

**Periodo:** 2026-II

## 1. Objetivo y arquitectura

La aplicación ofrece una API REST para administrar el proceso de servicio técnico y su inventario de repuestos. También incluye inicio de sesión JWT, perfil de usuario, permisos basados en roles y documentación OpenAPI.

| Aplicación | Responsabilidad |
| --- | --- |
| `config` | Configuración de Django, selección de base de datos por entorno y rutas principales. |
| `clients` | Modelo, serializer, administración y CRUD de clientes según `cliente`, conservando también `address`. |
| `equipment` | Equipos registrados para cada cliente. |
| `technicians` | Técnicos disponibles para atender órdenes de servicio. |
| `service_orders` | Órdenes de servicio, diagnósticos, consumo de repuestos, cotizaciones y garantías. |
| `spare_parts` | Catálogo de repuestos, precios y existencias disponibles. |
| `payments` | Pagos relacionados explícitamente con la orden y con el usuario autenticado que los registró. |
| `authentication` | Usuario personalizado, roles, asignaciones, recursos protegidos, tokens de renovación, JWT y permisos RBAC. |

Las relaciones principales son: un cliente puede tener varios equipos y órdenes; cada equipo se asigna a un cliente y una orden a un técnico. Una orden agrupa diagnósticos, consumos de repuestos, cotizaciones, pagos y, como máximo, una garantía. `SparePartConsumption` conserva la cantidad y el precio unitario aplicado a esa reparación. El pago conserva `reference_type` y `reference_id` del esquema original y además tiene relaciones explícitas opcionales a la orden de servicio y al usuario que lo registró. Así se puede mostrar el cliente desde la orden y el operador desde su usuario, sin adivinar a partir de una referencia genérica. Los registros históricos que no se puedan asociar de manera segura quedan sin esas relaciones y se identifican como antiguos. El dominio conserva las 16 tablas de ClimaTec (seis de autenticación/RBAC y diez de negocio). Como mejoras de implementación, `repuesto.stock` registra las existencias y `cliente.address` conserva la dirección que ya tenía el sistema; ambas son columnas complementarias, no tablas comerciales nuevas. Las existencias existentes se inicializan en cero porque no había un saldo confiable del cual reconstruir inventario; antes de registrar consumos nuevos, se debe ingresar el saldo físico real.

## 2. Configuración y ejecución

El proyecto requiere Python, las dependencias de `requirements.txt` y un motor de base de datos configurado. La selección del motor se hace con `DB_ENGINE` y las variables del motor elegido; las opciones de conexión están descritas en [.env.example](.env.example).

En este checkout, el entorno `.venv` pertenece a WSL: activa y ejecuta el proyecto desde una terminal WSL, no desde PowerShell. No se debe compartir un entorno virtual Linux con Python de Windows ni mover `.venv` junto con la carpeta del proyecto; los scripts de activación guardan la ruta original y dejan de funcionar al cambiar de ubicación. Si se mueve el proyecto, reconstruye el entorno desde su nueva carpeta con `python3 -m venv --clear .venv` y reinstala `requirements.txt`. La guía ISS-00 fija Python 3.12; el entorno local comprobado aquí usa Python 3.14.4, así que debe cambiarse a 3.12 para coincidir exactamente con ese requisito.

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

Completa `.env` con una clave secreta propia, el motor, la base de datos, el usuario, la contraseña y el host correspondientes. No publiques `.env` ni credenciales reales. Luego ejecuta:

```bash
python manage.py migrate
python manage.py check
python manage.py runserver 127.0.0.1:8000
```

Si el prompt muestra `(.venv)` pero aparece `Command 'python' not found`, comprueba si el proyecto o `.venv` se movieron desde otra carpeta. No basta con volver a activar el entorno viejo: desde la raíz actual del proyecto reconstruye `.venv` con `python3 -m venv --clear .venv`, actívalo e instala de nuevo las dependencias con `python -m pip install -r requirements.txt`.

La API usa el prefijo `/api/v1/`. Los nombres de campos de la API se representan en camelCase por la integración `djangorestframework-camel-case`; los modelos y el código Python mantienen snake_case. La raíz `/` no tiene una vista y responde 404 aunque el servidor esté funcionando; comprueba `/api/docs/` (Swagger), `/admin/` o una ruta de API.

## 3. Endpoints y flujo de uso

| Recurso | Rutas principales | Para qué sirve |
| --- | --- | --- |
| Clientes | `/api/v1/clients/` | CRUD de clientes mediante `ModelViewSet`, con nombre y dirección. |
| Servicio técnico | `/api/v1/equipment/`, `/api/v1/technicians/`, `/api/v1/service-orders/`, `/api/v1/diagnoses/`, `/api/v1/spare-part-consumptions/`, `/api/v1/quotes/`, `/api/v1/warranties/` | CRUD de las entidades del proceso de atención y reparación de equipos. |
| Repuestos y pagos | `/api/v1/spare-parts/`, `/api/v1/payments/` | Consulta y administración del inventario de repuestos, registro de su consumo en órdenes y pagos vinculados a una orden. |
| Autenticación | `/api/v1/auth/login/`, `/api/v1/auth/token/refresh/`, `/api/v1/auth/logout/`, `/api/v1/auth/me/` | Obtener y renovar tokens, cerrar sesión y consultar el perfil autenticado. |
| Matriz RBAC | `/api/v1/roles/`, `/api/v1/resources/`, `/api/v1/role-users/`, `/api/v1/resource-roles/` | Administrar roles, recursos y sus asignaciones. |
| Esquema y Swagger | `/api/schema/`, `/api/docs/` | Consultar el esquema OpenAPI y explorar la API. |

Para acceder a una ruta protegida, el cliente envía el token de acceso en el encabezado `Authorization: Bearer <access_token>`. El login personalizado entrega un par de tokens y añade `username` y `email` como claims. El access token dura 60 minutos y el refresh token un día. Al refrescar, se rota el refresh token y el anterior se añade a la lista negra; el logout también invalida el refresh token recibido.

## 4. Recorrido de las ISS y explicación para la sustentación

### Base del proyecto y modelos — ISS-00 a ISS-06

| ISS | Qué se hizo y cómo explicarlo |
| --- | --- |
| **00 — Entorno y proyecto (adaptado)** | Se preparó el entorno virtual y se revisaron `manage.py` y WSGI. El entorno WSL comprobado usa Python 3.14.4; la guía fija Python 3.12, por lo que esa versión sigue pendiente para el cumplimiento exacto. |
| **01 — Configuración y base de datos** | Los ajustes viven en `config/settings`; `database_from_environ()` selecciona la conexión por variables de entorno. `DJANGO_SECRET_KEY` es obligatoria y no se reemplaza por una clave insegura por defecto. |
| **02 — Aplicaciones Django (adaptado)** | Las apps se separan por responsabilidades de ClimaTec (`authentication`, `clients`, `equipment`, `technicians`, `spare_parts`, `service_orders` y `payments`). Esto difiere de las apps `client`, `product` y `sale` pedidas para StoreLab. |
| **03 — Usuario personalizado** | `CustomUser` extiende `AbstractUser`, añade correo único y marcas de tiempo. Se configura con `AUTH_USER_MODEL`; por eso debe definirse antes de aplicar las migraciones iniciales en una base nueva. |
| **04 — Cliente** | `Client` almacena nombre, tipo y número de documento, correo, teléfono, dirección, estado y fechas de auditoría. El número de documento es único; `address` se conserva como campo opcional complementario al DDL original. |
| **05 — Repuestos (adaptado)** | `SparePart` registra el catálogo técnico y existencias; no implementa `ProductType` ni `Product` de StoreLab. |
| **06 — Órdenes (adaptado)** | `ServiceOrder` relaciona cliente, equipo y técnico; `SparePartConsumption` registra lo usado en una reparación. No implementa `Sale` ni `ProductSale`. |

### API de negocio — ISS-07 a ISS-15

| ISS | Qué se hizo y cómo explicarlo |
| --- | --- |
| **07 — DRF, serializers y camelCase** | DRF convierte entre modelos y JSON mediante serializers. El parser y renderer camelCase aceptan y presentan nombres de campos en ese formato en la API. |
| **08 — API de clientes** | `ClientViewSet` y `DefaultRouter` exponen operaciones CRUD bajo `/api/v1/clients/`, evitando implementar manualmente cada método HTTP. |
| **09 — Catálogo (adaptado)** | Los viewsets y serializers exponen CRUD para equipos, técnicos, órdenes y repuestos; no existe el catálogo StoreLab de productos. |
| **10 — Existencias (adaptado)** | `/api/v1/spare-parts/` permite administrar los repuestos y sus existencias; no implementa el endpoint StoreLab de productos disponibles. |
| **11 — Registro de consumo (adaptado)** | Al crear un consumo activo, se bloquea la fila del repuesto, se valida el saldo y se descuenta dentro de una transacción. Esto no es el registro de venta StoreLab. |
| **12 — Ajustes de consumo (adaptado)** | Al editar, cambiar el repuesto, desactivar o eliminar un consumo, el inventario se ajusta o se repone. No existen consulta ni anulación de ventas. |
| **13 — Django Admin** | El admin muestra existencias en la lista de repuestos e incluye los consumos dentro de cada orden. La misma validación de stock se aplica desde el API y el panel. |
| **14 — OpenAPI y Swagger** | `drf-spectacular` genera el esquema en `/api/schema/` y la interfaz interactiva en `/api/docs/`. |
| **15 — JWT** | Se integró SimpleJWT y sus rutas para obtener/renovar tokens. La ruta `/api/v1/auth/login/` utiliza el serializer personalizado para agregar claims de usuario. |

### Autenticación y autorización — ISS-16 a ISS-25

| ISS | Qué se hizo y cómo explicarlo |
| --- | --- |
| **16 — Modelos RBAC** | `Role`, `RoleUser`, `Resource` y `ResourceRole` forman la matriz: un usuario puede tener roles y cada rol puede estar asociado a recursos identificados por ruta y método HTTP. |
| **17 — Login y claims** | El serializer de SimpleJWT añade `username` y `email` al access/refresh token. El endpoint abierto de login está en `/api/v1/auth/login/`. |
| **18 — Rotación y blacklist** | Se habilitó `token_blacklist`; al renovar el access token, el refresh se rota y el anterior se invalida. Esto limita la reutilización de refresh tokens ya consumidos. |
| **19 — Logout** | `/api/v1/auth/logout/` recibe un refresh token y lo incluye en la lista negra para cerrar esa sesión. |
| **20 — Perfil** | `/api/v1/auth/me/` devuelve los datos del usuario del token y sus roles. Requiere autenticación y también autorización RBAC para el recurso `GET /api/v1/auth/me/`. |
| **21 — Permiso dinámico** | `HasResourceAccess` comprueba que el usuario autenticado tenga un rol vinculado al recurso cuya ruta y método coinciden con la petición. La consulta usa relaciones que sí existen en los modelos; no depende de supuestos campos `is_active` en las tablas de relación. |
| **22 — Protección de vistas** | Las vistas del dominio ClimaTec aplican autenticación y `HasResourceAccess`. Primero se identifica al usuario con JWT; luego RBAC decide si alguno de sus roles tiene permiso para ese recurso. |
| **23 — CRUD de la matriz** | Los viewsets de roles, recursos, asignaciones de roles a usuarios y asignaciones de recursos a roles permiten administrar la matriz RBAC a través de la API. |
| **24 — Datos iniciales** | `python manage.py seed_rbac` crea los roles `ADMIN` y `CLIENT`, asigna `ADMIN` al primer usuario si existe y registra el permiso para `GET /api/v1/auth/me/` para ambos roles. Es una semilla mínima: los permisos de otras rutas deben agregarse a la matriz según las necesidades del sistema. |
| **25 — Respuestas 401 y 403** | Las pruebas de API comprueban HTTP 401 sin token y HTTP 403 cuando el token es válido pero el usuario carece del permiso RBAC. La autenticación identifica quién hace la petición; RBAC define qué puede hacer. |

## 5. Cómo funciona el inventario del servicio

1. Se registra o actualiza el saldo físico de un repuesto en `SparePart.stock`, ya sea desde el admin o el endpoint `/api/v1/spare-parts/`. Los registros antiguos se migran con stock cero; ese valor no afirma que el repuesto no exista, sino que no había un saldo fiable guardado.
2. Se agrega un `SparePartConsumption` a la orden desde el inline del admin o `/api/v1/spare-part-consumptions/`, enviando la orden, el repuesto, la cantidad positiva y el precio unitario.
3. En una transacción, el modelo bloquea con `select_for_update()` el repuesto elegido. Esto evita que dos órdenes concurrentes gasten las mismas unidades.
4. Si el repuesto está inactivo o no tiene existencias suficientes, la operación devuelve un error de validación y no deja un consumo parcial ni un stock negativo.
5. Si es válido, guarda el consumo y resta la cantidad. Si se edita la cantidad, se reserva o devuelve solo la diferencia; si cambia el repuesto, se devuelve el saldo al anterior y se reserva del nuevo.
6. Desactivar o eliminar un consumo repone las unidades consumidas. Reactivarlo vuelve a validarlas y descontarlas, por lo que la devolución no se duplica.

### Registrar y consultar un pago

En Django Admin se puede abrir **Pagos → Añadir** o entrar a una orden de servicio existente. En el formulario de pago, el campo **Orden de servicio** muestra opciones como `OS-2026-001 — Nombre del cliente — Técnico: Nombre del técnico`; selecciónala, completa método, monto, fecha y estado, y guarda. No se escoge el técnico dos veces: el pago lo toma de la orden seleccionada. También se puede añadir un pago desde la sección de pagos que aparece dentro de la pantalla de modificación de la orden.

Al guardar, el sistema enlaza el pago con esa orden y registra automáticamente el usuario autenticado como dato de auditoría. En la lista y el detalle del pago aparecen el cliente, la orden y el **técnico responsable** asignado a esa orden, además del método, el monto, la fecha y el estado. El usuario que inició sesión se conserva en la base como quién capturó el registro, pero el admin destaca al técnico que atendió el servicio. Diagnósticos, consumos, cotizaciones y garantías también muestran ese técnico en sus listas y dentro de la orden, para identificar quién quedó a cargo de las actividades asociadas. En Garantías, Cotizaciones y Diagnósticos, la interfaz muestra el cliente y el técnico en lugar del campo `name`; el valor interno se conserva para no cambiar el esquema ni borrar información existente. Para nuevos registros, ese valor interno se genera automáticamente a partir del cliente. En Cotizaciones y Diagnósticos se conserva la descripción para detallar, respectivamente, el alcance de la propuesta y la falla detectada. El endpoint autenticado `/api/v1/payments/` sigue la misma regla: requiere `serviceOrder`, registra al usuario del token y devuelve `client_name`, `technician_name` y `registered_by_username` (el renderer de la API los presenta en camelCase).

La captura previa muestra `referencia_tipo = motor` e identificador `1`, que no apuntan a una orden ni a un cliente; por eso no hay manera fiable de recuperar el cliente o el usuario que registró ese pago histórico. La migración asocia automáticamente solo referencias que coinciden con órdenes o cotizaciones existentes; ese registro no coincidente queda señalado como histórico y sin persona asociada. No debe asignársele un cliente por conjetura.

El pago pertenece a otro momento del flujo: registra el dinero recibido, pero no mueve inventario. La pieza se descuenta cuando se registra su consumo en la orden; pagar no significa que se haya usado una cantidad específica de repuestos. Así quedan separadas la evidencia contable (`pago`) y la operación física (`consumo_repuesto`).

## 6. Comprobaciones y evidencias

Las pruebas automatizadas verifican la consulta RBAC contra el esquema existente, las respuestas HTTP 401/403 en una ruta protegida, las relaciones del admin y el descuento/reposición de existencias al crear, modificar, desactivar o eliminar consumos. También comprueban que las rutas comerciales retiradas ya no estén registradas. Para ejecutar las comprobaciones:

```bash
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test
```
### Evidencias

### ISS-00 a ISS-04 — Entorno, configuración y cliente

**ISS-00: entorno virtual y estructura de Django**

![ISS-00: creación del entorno virtual](evidencias/05-django/01_iss00_env_setup.png)
![ISS-00: revisión de manage.py](evidencias/05-django/02_iss00_manage_py.png)
![ISS-00: imports en manage.py](evidencias/05-django/03_iss00_manage_import.png)
![ISS-00: configuración WSGI](evidencias/05-django/04_iss00_wsgi_setup.png)

**ISS-01: variables de entorno, conexión y migraciones**

![ISS-01: variables .env para MySQL](evidencias/05-django/05_iss01_dotenv_mysql.png)
![ISS-01: diagnóstico de error de migración](evidencias/05-django/06_iss01_traceback_error.png)
![ISS-01: configuración de settings](evidencias/05-django/07_iss01_settings_init.png)
![ISS-01: conexión en config/database.py](evidencias/05-django/08_iss01_database_py.png)
![ISS-01: migraciones iniciales exitosas](evidencias/05-django/09_iss01_migrate_ok.png)

**ISS-02 a ISS-04: aplicaciones, usuario y cliente**

![ISS-02: creación de las aplicaciones del negocio](evidencias/05-django/10_iss02_rm_duplicate_apps.png)
![ISS-02: verificación de configuración Django](evidencias/05-django/11_iss02_settings_check_ok.png)
![ISS-03: base de datos limpia para el usuario personalizado](evidencias/05-django/12_iss03_dbeaver_database_clean.png)
![ISS-03: migración del modelo CustomUser](evidencias/05-django/13_iss03_customuser_migration_ok.png)
![ISS-04: migración del modelo Client](evidencias/05-django/14_iss04_client_migration_ok.png)

### ISS-05 a ISS-15 — Dominio, API, admin y JWT

Las capturas de productos y ventas que siguen son evidencia histórica de una versión intermedia de desarrollo. Esas apps y sus endpoints ya no forman parte del backend ClimaTec actual; el flujo activo de inventario está documentado arriba como consumo de repuestos en órdenes de servicio.

![ISS-05: migración de productos](evidencias/05-django/15_iss05_products_migration_ok.png)
![ISS-06: migración de ventas](evidencias/05-django/16_iss06_sales_migration_ok.png)
![ISS-07: configuración de Django REST Framework](evidencias/05-django/17_iss07_rest_framework_settings.png)
![ISS-07: serializer de clientes y comprobación](evidencias/05-django/18_iss07_client_serializer_check.png)
![ISS-08: ViewSet y rutas CRUD de clientes](evidencias/05-django/19_iss08_client_viewset_urls.png)
![ISS-09 e ISS-10: API de productos y consulta de disponibles](evidencias/05-django/20_iss09_iss10_products_api_check_ok.png)
![ISS-11: endpoint de registro de venta](evidencias/05-django/21_iss11_register_sale_apiview.png)
![ISS-12: rutas de consulta y anulación de ventas](evidencias/05-django/22_iss12_sales_cancel_list_urls.png)
![ISS-13: administración de Django](evidencias/05-django/23_iss13_django_admin_config.png)
![ISS-14: esquema OpenAPI y Swagger](evidencias/05-django/24_iss14_openapi_swagger_urls.png)
![ISS-15: integración de SimpleJWT](evidencias/05-django/25_iss15_simplejwt_check_ok.png)

### ISS-16 a ISS-25 — Autenticación, RBAC y seguridad

![ISS-16: modelos RBAC y migración](evidencias/05-django/31_iss16_rbac_models_migration.png)
![ISS-17: login abierto y rutas JWT](evidencias/05-django/32_iss17_login_open_urls.png)
![ISS-18: migraciones de blacklist para refresh tokens](evidencias/05-django/33_iss18_token_blacklist_migration.png)
![ISS-19: logout y corrección de importación](evidencias/05-django/34_iss19_logout_importerror_resolved.png)
![ISS-20: perfil del usuario autenticado](evidencias/05-django/35_iss20_user_profile_me_check.png)
![ISS-21: permiso dinámico HasResourceAccess](evidencias/05-django/36_iss21_has_resource_access.png)
![ISS-22: protección RBAC de las vistas](evidencias/05-django/37_iss22_views_protected_rbac.png)
![ISS-23: rutas CRUD para administrar la matriz RBAC](evidencias/05-django/38_iss23_rbac_crud_urls.png)
![ISS-24: ejecución del seeder RBAC](evidencias/05-django/39_iss24_seed_rbac_terminal.png)
![ISS-25: respuesta HTTP 401 sin autorización](evidencias/05-django/40_iss25_unauthorized_401_check.png)
![ISS-25: respuesta 401 mostrada en el navegador](evidencias/05-django/41_iss25_unauthorized_browser_response.png)
