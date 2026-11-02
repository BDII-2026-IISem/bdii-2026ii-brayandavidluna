# ClimaTec — Base de Datos II

Proyecto académico para diseñar, implementar y documentar una base de datos para **ClimaTec**, un servicio técnico de refrigeración. El repositorio reúne el modelo relacional, scripts para cuatro motores, una API Django con autorización RBAC y un frontend Angular.

| Dato | Información |
| --- | --- |
| Estudiante | Brayan David Arévalo Luna |
| Docente | Ing. Jaider Quintero M. |
| Asignatura | Base de Datos II |
| Periodo | 2026-II |
| Repositorio | [BDII-2026-IISem/bdii-2026ii-brayandavidluna](https://github.com/BDII-2026-IISem/bdii-2026ii-brayandavidluna) |

## Contenido

- [Alcance y modelo de datos](#alcance-y-modelo-de-datos)
- [Estructura](#estructura)
- [Bases de datos y scripts SQL](#bases-de-datos-y-scripts-sql)
- [Despliegue de los motores](#despliegue-de-los-motores)
- [Backend Django](#backend-django)
- [Frontend Angular](#frontend-angular)
- [ISS y validaciones](#iss-y-validaciones)
- [Evidencias](#evidencias)
- [Seguridad y recomendaciones](#seguridad-y-recomendaciones)
- [Referencias](#referencias)

## Alcance y modelo de datos

El dominio es **servicio técnico de refrigeración**, no una tienda. La guía académica de Django usa StoreLab como ejemplo; ClimaTec conserva su propio modelo y no incorpora el catálogo comercial `ProductType/Product` ni las ventas `Sale/ProductSale`.

El esquema contiene **16 tablas**:

| Área | Tablas |
| --- | --- |
| Servicio técnico (10) | `cliente`, `equipo`, `tecnico`, `orden_servicio`, `diagnostico`, `repuesto`, `consumo_repuesto`, `cotizacion`, `pago`, `garantia` |
| Usuarios y RBAC (6) | `users`, `roles`, `role_users`, `resources`, `resource_roles`, `refresh_tokens` |

Un cliente puede tener equipos y órdenes; cada equipo pertenece a un cliente y una orden se asigna a un técnico. Una orden agrupa diagnósticos, consumos de repuestos, cotizaciones, pagos y una garantía. El inventario registra el saldo en `repuesto.stock`; `consumo_repuesto` descuenta unidades asociadas a una reparación. Los pagos registran el dinero recibido, no el consumo físico de una pieza.

El modelo conserva `cliente.address` y añade el vínculo opcional de una cuenta a un cliente. También mantiene relaciones de pago con la orden y con quien lo registró. Los saldos de inventario preexistentes se inicializaron en cero porque no había un saldo histórico confiable; debe ingresarse el inventario físico real antes de registrar consumos nuevos. Las antiguas aplicaciones comerciales de StoreLab fueron retiradas; una migración elimina sus tablas anteriores.

## Estructura

```text
basededatos2/
├── README.md                         # Documentación única y vista previa del proyecto
├── Backend-2026/Django/              # API Django, aplicaciones, pruebas y evidencia
├── Frontend-2026/Django/             # Aplicación Angular, pruebas y evidencia
└── Brayan/
    ├── scripts/
    │   ├── 01-mysql/
    │   ├── 02-postgresql/
    │   ├── 03-sql-server/
    │   └── 04-oracle/
    └── evidencias/                   # Capturas por motor
```

La documentación de procesos y los README secundarios se consolidaron en este archivo para que GitHub muestre toda la guía del proyecto desde la raíz. Las capturas, scripts, código y archivos de configuración permanecen en sus carpetas originales.

## Bases de datos y scripts SQL

Los scripts crean el esquema y datos de ClimaTec, realizan consultas y prueban rutinas adaptadas a cada dialecto:

| Motor | Versión | Contenedor habitual | Puerto | Script |
| --- | --- | --- | ---: | --- |
| MySQL | 8.0 | `mysql-server` | 3306 | [`01_ddl_dml_climatec.sql`](./Brayan/scripts/01-mysql/01_ddl_dml_climatec.sql) |
| PostgreSQL | 17 | `postgres-server` | 5432 | [`02_ddl_dml_climatec.sql`](./Brayan/scripts/02-postgresql/02_ddl_dml_climatec.sql) |
| Microsoft SQL Server | 2022 | `mssql-server` | 1433 | [`03_ddl_dml_climatec.sql`](./Brayan/scripts/03-sql-server/03_ddl_dml_climatec.sql) |
| Oracle Database XE | 21c | `oracle-server` | 1521 | [`04_ddl_dml_climatec.sql`](./Brayan/scripts/04-oracle/04_ddl_dml_climatec.sql) |

Las versiones específicas de scripts de consultas están dentro de la carpeta `consultas` de cada motor. Se usan las construcciones propias de cada motor: `BIGSERIAL`/identidad en PostgreSQL, `IDENTITY` y T-SQL en SQL Server, e identidad y PL/SQL en Oracle.

### Consultas, procedimientos y triggers

Las pruebas abarcan filtros `WHERE`, `OR`, `LIKE`/`ILIKE`, `BETWEEN`, `IN`, `IS NULL`, ordenamiento, `GROUP BY`, `HAVING`, `INNER JOIN`, `LEFT JOIN`, subconsultas, paginación y reportes del negocio.

- **MySQL:** 14 procedimientos: `sp_obtener_clientes_cc`, `sp_obtener_ordenes_cerradas_reparacion`, `sp_buscar_repuesto_compresor`, `sp_obtener_ordenes_agosto_2026`, `sp_obtener_tecnicos_especificos`, `sp_obtener_ordenes_sin_cerrar`, `sp_obtener_repuestos_mas_caros`, `sp_conteo_ordenes_por_tecnico`, `sp_tecnicos_mas_de_una_orden`, `sp_obtener_clientes_con_equipos`, `sp_obtener_ordenes_con_diagnostico`, `sp_repuestos_sobre_promedio`, `sp_top_3_repuestos_costosos` y `sp_reporte_inversion_repuestos_cliente`.
- **PostgreSQL, SQL Server y Oracle:** procedimientos o funciones parametrizadas para buscar clientes por tipo de documento, repuestos por nombre, órdenes por rango de fechas y estado, técnicos con un mínimo de órdenes y reportes de inversión por cliente.
- **Triggers de cierre:** las implementaciones de los motores asignan la fecha de cierre de una orden cuando su estado cambia a `CERRADA`, usando la sintaxis propia de cada dialecto.

## Despliegue de los motores

Los motores se trabajaron desde **Windows + WSL2/Ubuntu**, con **Docker Compose** y **DBeaver**. Comparten la red Docker `ia-lab-network` y guardan datos en volúmenes persistentes, organizados localmente bajo `~/ia-lab/data/{mysql,postgres,mssql,oracle}`. La dirección IP de WSL puede cambiar al reiniciar; consúltala con `ip a` antes de configurar una conexión remota.

Los archivos Docker Compose se mantienen en el entorno de servicios local, no en este repositorio. Desde la carpeta Compose de cada servicio:

```bash
docker compose up -d
docker ps
docker logs <nombre-del-contenedor> --tail 20
```

Las conexiones se verificaron desde DBeaver en los puertos de la tabla anterior. Para SQL Server se utilizan las herramientas `mssql-tools18`/`sqlcmd`; Oracle se conecta por nombre de servicio/PDB definido en su configuración (no confundir un service name con un SID).

Durante el trabajo se probaron respaldos con las herramientas nativas: `mysqldump` y `pg_dump` producen `.sql`, SQL Server produce `.bak` y Oracle Data Pump produce `.dmp`. Guarda los respaldos fuera del contenedor y comprueba periódicamente su restauración.

> Los nombres de bases y cuentas de las capturas pertenecen a distintas pruebas del curso; la base de la aplicación ClimaTec se configura de forma independiente mediante las variables de entorno de Django.

## Backend Django

El backend está en [`Backend-2026/Django/`](./Backend-2026/Django/). Está desarrollado con Django y Django REST Framework, serializers camelCase, JWT SimpleJWT, permisos RBAC y documentación OpenAPI/Swagger.

| Aplicación | Responsabilidad |
| --- | --- |
| `config` | Configuración, rutas y selección de base de datos por entorno |
| `clients` | Clientes y asociación opcional con cuenta |
| `equipment` | Equipos vinculados a clientes |
| `technicians` | Técnicos |
| `service_orders` | Órdenes, diagnósticos, consumos, cotizaciones y garantías |
| `spare_parts` | Catálogo de repuestos, existencias y disponibilidad |
| `payments` | Pagos vinculados a órdenes |
| `authentication` | Usuarios, roles, recursos, JWT y autorización RBAC |

### Preparar y ejecutar

Ejecuta estos comandos desde Ubuntu/WSL, en la carpeta que contiene `manage.py`. El entorno `.venv` de Linux no debe compartirse con Python de Windows ni reutilizarse tras mover el proyecto.

```bash
cd /home/brayan/ia-lab/projecs/basededatos2/Backend-2026/Django
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

Configura en `.env` una clave `DJANGO_SECRET_KEY` propia, `DB_ENGINE` y los parámetros del motor seleccionado. No publiques `.env`, claves ni contraseñas. Después:

```bash
python manage.py migrate
python manage.py check
python manage.py runserver 127.0.0.1:8000
```

La documentación interactiva queda en [`http://127.0.0.1:8000/api/docs/`](http://127.0.0.1:8000/api/docs/) y el esquema OpenAPI en `/api/schema/`. La raíz `/` puede responder 404; esto no significa que Django esté detenido.

La guía académica ISS-00 fija Python 3.12. El entorno local documentado fue Python 3.14.4 y pasó las comprobaciones del proyecto; queda registrada como una diferencia con la guía.

### API principal

Todas las rutas de recursos están bajo `/api/v1/`, terminan en `/` y entregan campos JSON camelCase.

| Recurso | Rutas |
| --- | --- |
| Clientes | `/clients/` |
| Equipos y técnicos | `/equipment/`, `/technicians/` |
| Órdenes y actividades | `/service-orders/`, `/diagnoses/`, `/spare-part-consumptions/`, `/quotes/`, `/warranties/` |
| Inventario y pagos | `/spare-parts/`, `/spare-parts/available/`, `/payments/` |
| Sesión | `/auth/login/`, `/auth/token/refresh/`, `/auth/logout/`, `/auth/me/`, `/auth/permissions/` |
| Administración RBAC | `/users/`, `/roles/`, `/resources/`, `/role-users/`, `/resource-roles/` |
| Esquema | `/api/schema/`, `/api/docs/` |

`ADMIN` obtiene acceso CRUD de acuerdo con la matriz de rutas y métodos. `CLIENT` tiene permisos de lectura para información asociada explícitamente a su cuenta; no puede escribir, consultar técnicos o consultar el inventario. La autorización se valida en el backend para cada solicitud.

Para crear roles y recursos iniciales, y conceder ADMIN a una cuenta existente elegida explícitamente:

```bash
python manage.py seed_rbac --username TU_USUARIO
```

Sustituye `TU_USUARIO` por el username real. El seeder es idempotente y **no** convierte automáticamente en ADMIN al primer usuario.

### Reglas del dominio

- La existencia se establece desde el saldo físico real del repuesto.
- Registrar un consumo activo valida stock y estado y descuenta unidades en una transacción con bloqueo de fila; cambios, desactivaciones y eliminaciones ajustan o reponen el saldo.
- Un pago no modifica el inventario; el consumo del repuesto sí.
- El cliente se vincula explícitamente a una cuenta, sin asociación automática por correo.
- El login emite access/refresh JWT; la renovación rota el refresh token y el logout lo invalida.
- `HasResourceAccess` autoriza por concesiones de método y ruta. Las rutas de detalle usan `<int:pk>`.

### ISS del backend

La guía de Django describe StoreLab. Las unidades se adaptaron al dominio ClimaTec; los ISS de productos/ventas se implementaron como repuestos/consumos de orden, no como una tienda.

| ISS | Implementación |
| --- | --- |
| 00–06 | Entorno/configuración, modelos, usuario, cliente, repuestos e intervenciones de servicio |
| 07–15 | DRF/serializers camelCase, APIs de clientes y catálogo, consulta de disponibles, stock de consumos, Django Admin, OpenAPI y JWT |
| 16–25 | Modelos RBAC, login/claims, rotación y blacklist, logout, perfil, permiso dinámico, protección de vistas, CRUD RBAC, seeder explícito y pruebas 401/403 |

El detalle técnico y las capturas de las ISS se conservan en [`Backend-2026/Django/evidencias/05-django/`](./Backend-2026/Django/evidencias/05-django/). Algunas imágenes de productos/ventas son evidencia histórica de una versión intermedia y no representan endpoints actuales.

## Frontend Angular

La aplicación está en [`Frontend-2026/Django/`](./Frontend-2026/Django/). Usa Angular 22 standalone, Signals, routing/lazy loading, PrimeNG 22/Aura, PrimeIcons y Tailwind CSS 4. La interfaz se comunica con Django por el proxy de desarrollo [`proxy.conf.json`](./Frontend-2026/Django/proxy.conf.json).

Para iniciar:

```bash
cd /home/brayan/ia-lab/projecs/basededatos2/Frontend-2026/Django
npm install
npm start
```

Abre `http://localhost:4200/`; el acceso empieza en `/login`. `/demo` contiene una demostración local sin llamadas a la API. La URL del backend se centraliza en `src/app/config/api.config.ts`.

Incluye dashboard con métricas, clientes, equipos, técnicos, repuestos, órdenes y detalle de orden. Los formularios y acciones de escritura se condicionan por los permisos efectivos del usuario; los datos reales se modifican únicamente desde una sesión autorizada.

### Autenticación, permisos y navegación

- Login JWT, refresh rotado, logout remoto, interceptor y guard de sesión.
- Al entrar se cargan en paralelo el perfil y `/auth/permissions/`; un fallo de cualquiera impide marcar la autorización como completa.
- La interfaz compara concesiones efectivas por método y ruta, incluidos IDs numéricos; no toma decisiones de autorización basadas solo en el nombre del rol.
- Las rutas protegidas usan guards y la falta de acceso muestra `/forbidden`.
- La pantalla `/admin/rbac` permite administrar usuarios, roles, recursos, asignaciones usuario-rol y concesiones rol-recurso. Las contraseñas solo se envían al crear un usuario; también se consultan sus permisos efectivos.
- El sidebar inicia oculto en escritorio y móvil. El botón de tres líneas lo abre; seleccionar un destino, pulsar fuera o cerrar el menú lo oculta. Cuando está oculto no recibe foco ni se expone como navegación activa.

## ISS y validaciones

### Frontend

| Unidad | Resultado |
| --- | --- |
| ISS-00–02 | Requisitos, bootstrap Angular, shell, modelos y conexión con JWT |
| ISS-03 | Clientes, adaptados a sus campos y endpoints reales |
| ISS-04 | Tipos de producto no aplican: ClimaTec no tiene esa entidad |
| Equipos y técnicos | CRUD adaptado al dominio de servicio |
| ISS-05 | Productos adaptados a catálogo de repuestos |
| ISS-06 | Ventas adaptadas a órdenes de servicio |
| ISS-07 | Detalle de orden, diagnósticos, consumos y dashboard |
| ISS-08–09 | Permisos efectivos, guards, navegación y acciones RBAC |
| ISS-10 | Administración de la matriz RBAC |
| ISS-11 | Suite y build de producción |

### Ejecuciones registradas

Desde `Frontend-2026/Django/`:

```bash
npm test -- --watch=false
npm run build
```

Última verificación registrada el 2026-11-02: **18 archivos de prueba, 76 pruebas aprobadas** y build de producción generado (bundle inicial 855.76 kB; página RBAC en chunk lazy).

Desde `Backend-2026/Django/`:

```bash
./.venv/bin/python manage.py test authentication
```

Última verificación enfocada: **28 pruebas de autenticación/RBAC aprobadas** y comprobación Django sin errores. Las pruebas usan bases temporales; no sustituyen una prueba de escritura contra datos reales.

La interfaz fue verificada con sesión ADMIN para lecturas reales de módulos existentes. Las escrituras de registros reales no se ejecutaron durante las verificaciones documentadas. La pantalla RBAC nueva tiene pruebas automatizadas; su inspección visual con los datos del navegador queda pendiente. En modo desarrollo puede aparecer un aviso de licencia PrimeUI no configurada; no impide compilar.

## Evidencias

Las capturas y sus nombres se mantienen en estas carpetas:

- [MySQL — DDL, GUI, filtros, joins y procedimientos](./Brayan/evidencias/01-mysql/)
- [PostgreSQL — DDL, consultas, funciones y triggers](./Brayan/evidencias/02-postgresql/)
- [SQL Server — DDL, consultas y procedimientos](./Brayan/evidencias/03-sql-server/)
- [Oracle — DDL, consultas, PL/SQL y triggers](./Brayan/evidencias/04-oracle/)
- [Django — ISS-00 a ISS-25](./Backend-2026/Django/evidencias/05-django/)
- [Frontend — login, demo, shell y clientes](./Frontend-2026/Django/evidencias/)

Las capturas de motores documentan creación de esquemas, inserciones, procedimientos/funciones, pruebas de conexión, respaldos y solución de incidencias. Las del frontend incluyen login sin credenciales, demostración local y capturas históricas con datos simulados. Las imágenes de los módulos reales que contienen datos personales no se incorporaron.

## Seguridad y recomendaciones

- No publiques `.env`, claves, contraseñas, tokens ni capturas con datos personales. Los secretos se omiten de esta documentación.
- Usa cuentas de base de datos con privilegios mínimos; no expongas usuarios administrativos ni permisos globales.
- Limita los puertos publicados a las redes necesarias y vuelve a comprobar la IP de WSL si cambia.
- Mantén respaldos fuera de los contenedores y prueba periódicamente su restauración.
- No subas el entorno virtual `.venv`, `node_modules` ni bases locales.
- La herramienta de IA se utilizó como apoyo para resolver problemas y desarrollar; las decisiones se adaptaron al dominio ClimaTec y se contrastaron con pruebas, scripts y el modelo del proyecto.

## Referencias

- [Guía académica de introducción a bases de datos](https://tecnogua.com/academic/site/bd/introduccion/)
- [Instalación de MySQL](https://tecnogua.com/academic/site/bd/instalacion/mysql/)
- [Instalación de PostgreSQL](https://tecnogua.com/academic/site/bd/instalacion/postgresql/)
- [Instalación de Microsoft SQL Server](https://tecnogua.com/academic/site/bd/instalacion/mssql/)
- [Instalación de Oracle XE](https://tecnogua.com/academic/site/bd/instalacion/oracle/)
- [Guía académica de Django/Frontend](https://tecnogua.com/academic/site/frontend2026/django/)
