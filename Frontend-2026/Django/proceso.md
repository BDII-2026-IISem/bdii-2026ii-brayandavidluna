# Proceso de desarrollo — Frontend ClimaTec

Bitácora de construcción y verificación del frontend ubicado en `Frontend-2026/Django`. Se seguirá la secuencia ISS de la guía académica, pero cada pantalla y contrato se adaptará a ClimaTec. La guía describe StoreLab; no se copiarán sus módulos de productos comerciales ni ventas.

**Último barrido:** 2026-11-02
**Estado general:** frontend Angular integrado con Django; sesión ADMIN y lecturas reales verificadas. Las escrituras reales no se ejecutan sin autorización explícita.

## 1. Adaptación del dominio y API

El backend de referencia está en [`../../Backend-2026/Django/`](../../Backend-2026/Django/). Su base de API es `http://localhost:8000/api/v1`; cada endpoint de recurso termina en `/`. DRF transforma las claves a camelCase. Las rutas de negocio exigen JWT y autorización RBAC.

| Dominio ClimaTec | Endpoint |
| --- | --- |
| Clientes | `/clients/` |
| Equipos | `/equipment/` |
| Técnicos | `/technicians/` |
| Órdenes de servicio | `/service-orders/` |
| Diagnósticos | `/diagnoses/` |
| Consumos de repuestos | `/spare-part-consumptions/` |
| Repuestos disponibles | `/spare-parts/available/` |
| Cotizaciones y garantías | `/quotes/`, `/warranties/` |
| Pagos | `/payments/` |
| Login, refresh, logout y perfil | `/auth/login/`, `/auth/token/refresh/`, `/auth/logout/`, `/auth/me/` |
| Swagger y esquema OpenAPI | `/api/docs/`, `/api/schema/` |

Los endpoints de negocio y autenticación de la tabla son relativos a `/api/v1`; Swagger y OpenAPI son `/api/docs/` y `/api/schema/`. En el desarrollo se usa el proxy de Angular (`proxy.conf.json`) porque el backend no agrega `Access-Control-Allow-Origin` para el origen del frontend.

### Diferencias relevantes frente a StoreLab

- No hay `API_ACCESS=open/rbac` ni `/auth/permissions/` en el backend revisado.
- El perfil es `/auth/me/`; entrega `roles`, no una propiedad `role` singular.
- El rol `CLIENT` tiene permisos de lectura para sus recursos ClimaTec; Django filtra cada consulta mediante el vínculo explícito usuario-cliente. Esto no sustituye la autorización del servidor ni permite escrituras.
- El login está basado en SimpleJWT; no se presuponen campos adicionales de la guía StoreLab.
- `Client` expone `documentType`, `documentNumber` e `isActive`.
- `Equipment` expone `client` como ID, `name`, `description` y `status`; no hay número de serie ni ubicación.
- `ServiceOrder` expone IDs `client`, `equipment`, `technician`, además de `number`, `openedAt`, `total` y `status`.
- Los importes se conservan como cadenas decimales cuando se tipen en TypeScript.

## 2. Estado por ISS

“Código presente” no significa que la unidad esté cerrada: el gate exige pruebas y, para las pantallas protegidas, validación con una cuenta autorizada.

| ISS | Unidad adaptada | Estado |
| --- | --- | --- |
| ISS-00 | Requisitos previos, contrato y entorno | **PASS** para continuar. Endpoints protegidos comprobados sin sesión y responden `401`, como se espera. |
| ISS-01 | Bootstrap Angular 22, PrimeNG, Tailwind y ejemplo ClimaTec | **PASS** después del barrido: build, pruebas y ruta `/demo` verificados. |
| ISS-01A | Shell Header / Aside / contenido / Footer | **PASS:** layout adaptable, navegación a módulos existentes, perfil y logout integrados; interacción móvil y pruebas verificadas. |
| ISS-01B | Menú PrimeNG e interacción de navegación | **PASS:** menú lateral integrado, rutas activas y cierre del drawer móvil verificados. |
| ISS-02 | Núcleo, modelos, configuración API y layout | **PASS:** login JWT, refresh rotado, guard/logout, configuración API centralizada y modelos tipados. Suite y build aprobados; login manual confirmado con la cuenta ADMIN y carga del perfil desde Django. |
| ISS-03 | Clientes | **PASS técnico y lectura real:** CRUD tipado implementado, pruebas de componentes/HTTP aprobadas y listado consultado desde Django con sesión ADMIN. La captura del usuario confirma la pantalla; no se guardó en el repositorio porque contiene datos personales. No se hicieron escrituras reales durante la validación. |
| ISS-04 | CRUD de tipos de producto (guía StoreLab) | **No aplicable al contrato ClimaTec:** no hay modelo, endpoint ni relación de tipo/categoría en el backend. No se crea una entidad artificial. |
| ClimaTec — Equipos y técnicos | Entidades base del servicio | **PASS:** CRUD tipado y lectura real autenticada comprobada en ambas rutas; escrituras solo ADMIN y relación equipo-cliente. Trabajo de dominio adicional, no corresponde al ISS-04 de la guía. |
| ISS-05 | CRUD de productos (guía StoreLab), adaptado a repuestos | **PASS técnico y lectura real:** CRUD/estado y filtro de disponibles adaptados al modelo existente; pruebas y build aprobados. |
| ISS-06 | Flujo de ventas, adaptado a órdenes de servicio | **PASS técnico y lectura real:** registro de órdenes relacionado con cliente, equipo y técnico; pruebas/build aprobados. Los diagnósticos y consumos son recursos independientes y se detallan en ISS-07. |
| ISS-07 | Detalle de operación y dashboard | **PASS técnico y lectura real:** detalle de orden con diagnósticos y consumos, acciones ADMIN, métricas calculadas con la API y pruebas/build aprobados. |
| ISS-08–ISS-10 | Fase Auth con RBAC | **PASS funcional:** login/perfil, refresh rotado, logout, guard de sesión y vistas/acciones restringidas por rol ya estaban integrados desde ISS-02; se agregaron pruebas directas de redirección/retorno del guard. No se repitió funcionalidad existente. |
| Administración RBAC | Gestión de roles y asignaciones | **Pendiente de decisión de contrato:** el backend ofrece `/roles/`, `/resources/`, `/role-users/` y `/resource-roles/`, pero no expone una colección `/users/` para seleccionar cuentas de forma segura en una UI administrativa. |

### Inventario comprobado del frontend

- Angular 22 standalone, routing y lazy loading para dashboard, clientes, equipos, técnicos y órdenes.
- Shell protegido con header, navegación lateral, contenido responsivo y footer.
- Login JWT, perfil, refresh rotado, logout remoto, `authInterceptor` y `authGuard` presentes.
- Los modelos de clientes, equipos, técnicos, órdenes, diagnósticos, repuestos y pagos siguen los serializers Django camelCase.
- `ApiService` tipa sus respuestas y payload de orden; el normalizador de colecciones admite arrays y páginas `results`.
- Clientes, equipos, técnicos y órdenes consultan la API ClimaTec; clientes, equipos y técnicos tienen formularios CRUD.
- Repuestos tiene inventario CRUD restringido a ADMIN y consulta del endpoint real de disponibles.
- Órdenes tiene listado real y formulario de creación restringido a ADMIN; los equipos se filtran por el cliente seleccionado.
- El detalle de orden separa diagnósticos y consumos conforme al modelo de Django; el dashboard resume órdenes, clientes, equipos y repuestos disponibles.
- `ApiService` usa rutas ClimaTec bajo `/api/v1`.
- El perfil se muestra con `roles`; no se presenta la autorización del cliente como sustituto del RBAC del servidor.
- La autenticación recupera el perfil del backend, guarda tokens rotados, reintenta una petición una sola vez y elimina la sesión si el refresh falla.
- Las rutas autenticadas mantienen `returnUrl`; en el shell y los componentes los controles administrativos solo se muestran a `ADMIN`, además del control RBAC del backend.
- La vista de ejemplo local de orden está disponible en `/demo`; no hace llamadas HTTP.
- `/` está protegido por `authGuard` y conduce al login si no hay token.

## 3. ISS-00 — Requisitos previos

### Criterios y evidencia técnica

| Comprobación | Resultado |
| --- | --- |
| Node.js / npm / Angular CLI | `v24.15.0` / `11.12.1` / `22.2.5`, ejecutados en WSL. |
| Backend Django | `./.venv/bin/python manage.py check` → `System check identified no issues (0 silenced).` |
| Swagger por el backend | `GET http://127.0.0.1:8000/api/docs/` → `200`. |
| OpenAPI por el backend | `GET http://127.0.0.1:8000/api/schema/` → `200`. |
| Login sin credenciales | `OPTIONS /api/v1/auth/login/` → `200`; no se enviaron credenciales. |
| Clientes sin sesión | `GET /api/v1/clients/` → `401`; ruta protegida correctamente. |
| Repuestos disponibles sin sesión | `GET /api/v1/spare-parts/available/` → `401`; ruta protegida correctamente. |
| CORS para `localhost:4200` | No se recibió `Access-Control-Allow-Origin`; se configura proxy local en ISS-01. |
| Datos / escrituras | No se hicieron escrituras ni se ejecutó el seeder contra la base normal. Las pruebas posteriores usan la base aislada de test y usuarios efímeros. |

Node.js `24.15.0` se instaló en el espacio de usuario de WSL desde la distribución oficial Linux x64; el SHA-256 coincidió con el publicado por Node. Angular CLI 22 se instaló con npm en el mismo prefijo local. No se modificó la configuración global del sistema.

### Resultado al probar el proxy

Con Django y Angular levantados temporalmente, se hicieron solicitudes de lectura a través de `http://127.0.0.1:4200`:

| Ruta por el proxy | Código | Evidencia |
| --- | ---: | --- |
| `/api/docs/` | `200` | Proxy hacia Swagger de Django |
| `/api/schema/` | `200` | Proxy hacia OpenAPI |
| `/api/v1/clients/` | `401` | El proxy llega al endpoint; RBAC requiere sesión |

Ambos servidores temporales se detuvieron al terminar la verificación. No se dejó el backend corriendo.

## 4. ISS-01 — Bootstrap y prueba de interfaz

### Implementación

- `ng new` creó el proyecto directamente en esta carpeta con routing, SPA y sin inicializar otro repositorio Git.
- Tailwind CSS 4 se configuró mediante `.postcssrc.json`.
- PrimeNG 22 usa Aura, capas CSS y PrimeIcons.
- Se configuró locale Angular `es-CO`.
- El shell raíz usa `RouterOutlet`; existe `/login`, y la ruta pública `/demo` muestra una orden ficticia ClimaTec con Signals.
- Se conectó `proxy.conf.json` al servidor Angular de desarrollo.
- La advertencia de licencia PrimeUI no bloquea la compilación ni la renderización.

### Barrido, correcciones y validaciones

Durante el barrido del 2026-11-02 se encontraron y corrigieron:

1. El root component no renderizaba el router; aunque la URL cambiaba a `/login`, se seguía viendo la demostración. Se conectó `RouterOutlet`.
2. `angular.json` refería un `proxy.conf.json` que no existía. Se creó el proxy hacia `127.0.0.1:8000`.
3. Varios tests importaban nombres no exportados (`Clients`, `Equipment`, `Api`, `Auth`, etc.). Se alinearon con los nombres reales y se añadieron dobles de prueba para las dependencias.
4. Existía un interceptor duplicado que no agregaba autenticación. Se eliminó y el test ahora verifica el interceptor utilizado por la aplicación.
5. Las tablas de clientes, equipos y órdenes usaban propiedades de StoreLab/no existentes. Se cambiaron por los campos del contrato ClimaTec observado.

Ejecuciones:

```text
npm run build
Application bundle generation complete.
Initial total: 760.14 kB
```

```text
npm test -- --watch=false
Test Files  10 passed (10)
Tests       14 passed (14)
```

El build queda bajo el límite actual de warning `1MB` y error `1.5MB`. En navegador se verificó `/login` y `/demo`; los botones del demo actualizaron estimado, estado y descripción. PrimeUI informa que no hay licencia configurada; es un aviso visual de la dependencia, no un fallo de build.

## 5. ISS-01A — Shell y layout responsivo

Se integró un layout común para las rutas autenticadas: header con marca, usuario/roles y cierre de sesión; navegación lateral a Inicio, Clientes, Equipos y Órdenes; área de contenido y footer. El menú se convierte en drawer móvil con backdrop y se cierra al seleccionar una opción. Se usaron únicamente rutas que ya existen y se eliminó del dashboard el header/logout duplicado. Las rutas `/login` y `/demo` siguen fuera del shell protegido.

La captura de evidencia usa un perfil ficticio servido por interceptación local del navegador: comprueba la presentación, no demuestra credenciales reales ni una sesión con Django. La sesión de prueba se limpió al terminar.

```text
npm test -- --watch=false
Test Files  11 passed (11)
Tests       25 passed (25)

npm run build
Application bundle generation complete.
Initial total: 778.47 kB
```

La navegación adaptativa se inspeccionó en navegador a 390 px y 1440 px; el drawer abre y cierra, y en escritorio la navegación queda fija. Evidencia: [captura del shell ClimaTec](./evidencias/iss-01a-shell.png).

## 6. ISS-01B — Menú PrimeNG e interacción de navegación

Se sustituyeron los enlaces manuales de la barra lateral por el componente `Menu` de PrimeNG. Los destinos usan `routerLink`; Inicio marca coincidencia exacta y la opción correspondiente queda activa según la ruta. Al seleccionar una opción se cierra el drawer móvil. Se conservaron los destinos implementados y los colores/contraste de la navegación ClimaTec.

Validaciones:

```text
npm test -- --watch=false
Test Files  11 passed (11)
Tests       26 passed (26)

npm run build
Application bundle generation complete.
Initial total: 831.02 kB
```

En navegador se verificaron los cuatro enlaces, navegación a Clientes y resaltado de ruta activa. En viewport móvil de 390 px el drawer abre y se cierra al navegar. La captura usa un perfil ficticio y datos simulados solo para comprobar la presentación; no representa autenticación real con Django. Al terminar se limpiaron los tokens temporales. Evidencia: [menú PrimeNG del shell](./evidencias/iss-01b-menu.png).

## 7. ISS-02 — Integración JWT y barrido de backend

Se alineó `AuthService` con las rutas reales de Django: `/auth/login/`, `/auth/me/`, `/auth/token/refresh/` y `/auth/logout/`. El login no termina hasta cargar el perfil; la sesión restaurada vuelve a consultar `/me/`; ante un `401` de una ruta de negocio se comparte una sola petición de refresh en curso, se guardan ambos tokens rotados y se reintenta la petición una vez. Los endpoints de token no reciben el access token. El interceptor limita el Bearer a `/api/v1/` para no enviarlo a otros orígenes.

El logout envía el refresh token al backend y limpia la sesión local incluso si la invalidación remota falla; en ese caso se muestra un aviso en login. El guard devuelve una redirección Angular y el login respeta `returnUrl` local sin aceptar destinos externos.

También se corrigió `seed_rbac`: antes entregaba `ADMIN` automáticamente al primer usuario de la base, lo cual podía elevar una cuenta no elegida. Ahora crea roles y permisos sin asignar privilegios si no se proporciona `--username`; un usuario inexistente produce error antes de escribir. README y documentación del backend describen el nuevo uso.

Validaciones de esta ronda:

```text
npm test -- --watch=false
Test Files  10 passed (10)
Tests       22 passed (22)

npm run build
Application bundle generation complete.
Initial total: 764.33 kB

python manage.py test
Ran 42 tests
OK
System check identified no issues (0 silenced).
```

Los tests del frontend simulan login/perfil, rotación, retry, logout y limitación del encabezado; los tests Django verifican login, perfil, refresh rotado/blacklist, logout y RBAC en la base temporal de pruebas. Esto valida el contrato de ambos lados, no reemplaza la comprobación visual con una cuenta autorizada contra la base de desarrollo.

### Tipado de API y configuración común

Se centralizó `/api/v1` para `ApiService`, `AuthService` y el interceptor. Se agregaron modelos TypeScript basados en los serializers y campos FK de Django; los decimales se tipan como cadenas, las relaciones como IDs y los campos nulos conservan `null`. Los listados aceptan respuestas en array (formato actual sin paginación global) y el formato paginado `results` que ya contemplaba el frontend. Se quitaron los `any` de las respuestas de API y los arreglos de los componentes de consulta.

Validación posterior a la implementación:

```text
npm test -- --watch=false
Test Files  11 passed (11)
Tests       29 passed (29)

npm run build
Application bundle generation complete.
Initial total: 828.14 kB
```

Los tests HTTP verifican las seis rutas de lectura, el payload tipado de creación de órdenes y la normalización de colecciones simples/paginadas. No se usaron credenciales reales ni se escribieron datos en la base Django.

### Evidencias visuales

- [Captura del login ClimaTec](./evidencias/iss-01-login.png) — ruta `/login`, campos vacíos; no contiene credenciales.
- [Captura del ejemplo de orden](./evidencias/iss-01-demo-orden.png) — ruta `/demo`, datos ficticios locales; controles para actualizar el monto, estado y descripción.
- [Captura de interacciones del ejemplo](./evidencias/iss-01-demo-interaccion.png) — aumento a `$181.000`, cambio a **Diagnóstico** y texto de vista previa actualizado.

## 8. ISS-03 — Clientes

Se implementó el CRUD de clientes sobre los endpoints reales de ClimaTec, con modelos y payloads tipados, formulario de alta/edición, confirmación de borrado y mensajes de estado. Las acciones de escritura solo se muestran a usuarios con rol `ADMIN`; el backend conserva la autoridad final de autorización. Se contemplan errores al eliminar clientes relacionados con equipos u órdenes.

La suite frontend pasó con **33 pruebas** y `npm run build` finalizó correctamente (bundle inicial de 844.88 kB). Las pruebas de servicio verifican rutas HTTP y métodos; las de componente cubren listado, creación, edición, borrado confirmado y restricción del rol CLIENT. En el navegador del usuario se confirmó el inicio de sesión con ADMIN y la carga del listado desde Django, con tres clientes y acciones visibles. No se ejecutó una escritura en producción ni se almacenó la captura compartida, pues contiene información personal de clientes. La captura local anterior usa datos simulados y se renombró para no presentarla como evidencia de la sesión real: [captura simulada de clientes](./evidencias/iss-03-clientes-mock.png).

## 9. ClimaTec — Equipos y técnicos

Se ampliaron las pantallas de equipos y se agregó la pantalla de técnicos usando los campos, claves foráneas, endpoints y estados definidos en los serializers Django. El formulario de equipos asocia un cliente real por su ID y muestra el nombre cuando está disponible. Ambas pantallas ofrecen alta, edición y borrado con confirmación; las operaciones de escritura y el acceso de navegación a técnicos quedan limitados a `ADMIN`, de acuerdo con la matriz RBAC existente. Esta entrega es trabajo propio del dominio ClimaTec: la ISS-04 de la guía StoreLab trata de tipos de producto.

Las pruebas cubren rutas HTTP tipadas, listados, creación, edición, borrado confirmado, asociación equipo-cliente y restricciones de rol. La suite completa pasó con **43 pruebas** y `npm run build` finalizó correctamente (bundle inicial de 845.37 kB). Con la sesión ADMIN del usuario se abrieron `/equipment` y `/technicians`: ambas mostraron su contenido y filas desde Django, sin realizar escrituras. No se guardó una captura de esas tablas porque contienen datos reales.

## 10. ISS-04 — Tipos de producto (adaptación no aplicable)

La guía solicita CRUD para tipos de producto, pero los modelos y rutas de ClimaTec no incluyen tipos ni categorías de repuesto/producto. El backend sí ofrece directamente `SparePart` con nombre, descripción, precio, existencias y estado. Agregar una pantalla de tipos implicaría inventar una relación y alterar el backend fuera del alcance frontend; se deja esta ISS como **no aplicable** y se continúa con la ISS-05 adaptada a repuestos.

## 11. ISS-05 — CRUD de productos, adaptado a repuestos

Se implementó el inventario contra `GET/POST /api/v1/spare-parts/`, `PATCH /api/v1/spare-parts/{id}/` y `GET /api/v1/spare-parts/available/`. La pantalla incluye búsqueda local, filtro real de disponibles, precio COP, existencias, alerta visual al agotarse, formulario y activación/desactivación confirmada. La entidad no tiene marca, tipo ni stock mínimo; la alerta se limita a existencias cero. Los consumos protegen la referencia del repuesto en Django, por lo que la baja cambia `status` a `INACTIVE` mediante PATCH en lugar de ejecutar DELETE físico. El módulo y el enlace del dashboard/menú se restringen a ADMIN.

La suite pasó con **50 pruebas** en 13 archivos; `npm run build` finalizó correctamente con un bundle inicial de 848.56 kB. Las pruebas nuevas cubren endpoints, serialización decimal a dos posiciones, validación de stock, disponibilidad y baja lógica confirmada. En el navegador real con sesión ADMIN se cargó el inventario y se conmutó entre inventario y disponibles; cada vista mostró el repuesto existente. No se hicieron escrituras reales ni se guardó una captura con información de negocio.

## 12. Gaps conocidos antes de avanzar

- La autenticación y lectura de clientes se confirmaron manualmente; altas, cambios y bajas se validaron con pruebas automatizadas HTTP simuladas, no mediante escrituras reales en la base.
- Los IDs relacionados de órdenes se presentan con nombres cargados desde los endpoints autorizados.
- La advertencia visual de licencia de PrimeUI sigue presente en desarrollo y no bloquea la compilación.
- Las operaciones de escritura de clientes, equipos, técnicos y repuestos tienen cobertura automatizada, pero no se probaron haciendo cambios en la base real.

## 13. ISS-06 — Órdenes de servicio, adaptadas a ventas

Se adaptó el flujo principal de ventas de la guía a la creación de órdenes de servicio ClimaTec. El formulario ADMIN relaciona cliente, equipo activo de ese cliente y técnico activo; valida los campos, evita asociaciones incompatibles y registra automáticamente la fecha local con su offset. La tabla presenta número, relaciones, estado, fecha y total desde el endpoint de Django.

El backend no tiene ventas ni líneas de venta anidadas: diagnósticos y consumos se guardan en recursos separados vinculados a la orden. No se inventó una estructura de ventas; esos detalles se trabajan en ISS-07.

Validaciones:

```text
npm test -- --watch=false
Test Files  13 passed (13)
Tests       54 passed (54)

npm run build
Application bundle generation complete.
Initial total: 848.38 kB
```

En el navegador, con la sesión ADMIN, la ruta `/service-orders` cargó una orden desde Django. El formulario cargó 2 clientes y 1 técnico; al elegir el cliente correspondiente se ofreció su equipo activo. Se canceló el formulario sin enviar escrituras. No se guarda captura de esta vista porque muestra datos personales reales.

## 14. ISS-07 — Detalle de operación y dashboard

Se agregó navegación desde cada orden a una vista de detalle con relaciones resueltas a nombres y las tablas de diagnósticos y consumos asociados. ADMIN puede registrar diagnósticos y consumos con formularios validados; los diagnósticos se desactivan/reactivan con confirmación. Los consumos también se anulan/reactivan con confirmación mediante PATCH: la lógica del backend restaura o reserva el inventario dentro de su transacción; no se hace DELETE físico. El precio unitario se captura desde el catálogo del repuesto y el backend sigue siendo responsable de validar disponibilidad y stock.

El dashboard dejó las tarjetas estáticas y ahora calcula órdenes abiertas, clientes activos, equipos activos y, solo para ADMIN, repuestos disponibles. Sus datos se obtienen de colecciones API autorizadas; no se consultan endpoints de inventario o técnicos para usuarios CLIENT. Esta adaptación no incorpora ventas, detalles anidados, gráficos ni pagos que no estén modelados en la entidad.

Validaciones:

```text
npm test -- --watch=false
Test Files  14 passed (14)
Tests       61 passed (61)

npm run build
Application bundle generation complete.
Initial total: 849.55 kB
```

En navegador con sesión ADMIN se cargó el detalle real de una orden, sus relaciones por nombre, ambas tablas y las métricas del dashboard. Se abrieron y cancelaron los formularios de diagnóstico y consumo sin enviar escrituras; la pantalla no mostró errores. No se guardó una captura porque las tablas contienen datos personales reales. Las escrituras de diagnósticos/consumos y sus cambios de estado quedan verificadas en pruebas automatizadas; no se modificó la base real.

### Gaps antes de la siguiente ISS

- Los formularios de órdenes, diagnósticos y consumos todavía no se han enviado a la base de desarrollo; la validación de escritura usa servicios mock y la validación visual solo lee/cancela.
- PrimeUI sigue mostrando el aviso de licencia no configurada en desarrollo.
- La pantalla nueva de administración RBAC tiene cobertura automatizada, pero aún no se ha comprobado en navegador con una sesión ADMIN real. No se hicieron escrituras sobre la base de datos de desarrollo.

## 15. ISS-08 — Autenticación y permisos efectivos

Se extendió el inicio/restauración de sesión para obtener en paralelo el perfil (`/api/v1/auth/me/`) y los permisos efectivos (`/api/v1/auth/permissions/`). El estado de autorización se marca como cargado únicamente cuando ambas respuestas llegan correctamente; si falla cualquiera, no queda un perfil parcial que permita pasar guards. Al cerrar sesión también se descartan permisos.

El modelo `EffectivePermission` conserva método, ruta, rol concedente e ID. `AuthService.hasPermission()` compara el método y la ruta completa, aceptando `<int:pk>` solo cuando el segmento concreto es numérico. La API backend calcula las concesiones a partir de las relaciones reales de roles y recursos.

```text
Backend: ./.venv/bin/python manage.py test authentication
Ran 28 tests — OK

AuthService: login/restauración, permisos concurrentes, comparación método/ruta,
parámetro numérico, fallo de permisos sin estado parcial y limpieza de sesión.
```

## 16. ISS-09 — Guards y RBAC en la interfaz

Se agregó `permissionGuard` en las vistas de negocio y una página `/forbidden`. El guard exige permisos GET específicos para la vista y resuelve `:id` a una ruta API concreta antes de comparar. `guestGuard` redirige sesiones ya autenticadas desde `/login`; el `authGuard` existente conserva el `returnUrl` y presenta errores si el servidor no valida la sesión.

El menú y las acciones existentes consultan concesiones efectivas, no el nombre `ADMIN`. La carga de técnicos/inventario se mantiene condicionada a sus permisos de lectura, mientras que los controles de escritura requieren los métodos de escritura correspondientes. El servidor continúa siendo la autoridad final; la interfaz no sustituye los permisos del backend.

Cobertura nueva: guards de sesión invitada y permiso, incluyendo denegación, ruta con ID numérico y falta de concesión.

## 17. ISS-10 — Administración de la matriz RBAC

Se conectó la pantalla `/admin/rbac` a los endpoints Django existentes:

- `/users/`: CRUD de usuarios; la contraseña se solicita solo al crear, nunca se muestra ni se envía al editar.
- `/roles/` y `/resources/`: CRUD de roles y recursos (método + ruta).
- `/role-users/` y `/resource-roles/`: CRUD de asignaciones mediante selectores de usuarios, roles y recursos existentes; no se solicitan IDs manuales.
- `/users/{id}/permissions/`: consulta de permisos efectivos por cuenta.

La ruta y el enlace del menú exigen concesiones de lectura, creación, edición y eliminación para los cinco recursos, en coherencia con las operaciones que expone esta pantalla. Las restricciones del backend para proteger la cuenta activa siguen aplicándose.

## 18. ISS-11 — Verificación de calidad

Evidencia final de esta fase:

```text
npm test -- --watch=false
Test Files  18 passed (18)
Tests       76 passed (76)

npm run build
Application bundle generation complete.
Initial total: 855.76 kB
Chunk lazy: rbac-admin (32.38 kB)
```

La suite comprueba también los endpoints RBAC de lectura, creación, actualización, eliminación y consulta de permisos efectivos. Se validó el build de producción. No se guardaron capturas con información personal ni se enviaron escrituras a la base real. No se creó ningún commit.

### Pendiente de verificación manual

- Abrir `/admin/rbac` con la sesión ADMIN del navegador y confirmar la presentación con datos reales; no probar altas, cambios ni eliminaciones sin autorización expresa.
- El aviso de licencia PrimeUI continúa apareciendo en modo desarrollo.
