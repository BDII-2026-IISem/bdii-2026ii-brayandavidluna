# StoreLab / ClimaTec - Backend Django & DRF (Fase II: Auth con RBAC)

**Asignatura:** Base de Datos II  
**Estudiante:** Brayan David Arévalo Luna  
**Docente:** Ing. Jaider Quintero M.  
**Periodo:** 2026-II  

---

## 📋 Resumen del Bloque (ISS-16 al ISS-20)

Implementación del subsistema de autenticación y control de acceso basado en roles (**RBAC**) y gestión de sesiones mediante tokens JWT utilizando **Django REST Framework (DRF)** y `djangorestframework-simplejwt`.

---

## 🛠️ Detalle de Hitos Implementados

### ISS-16: Modelos RBAC
Se estructuraron e implementaron los modelos relacionales transversales para la gestión de seguridad en `authentication/models.py`:
- `CustomUser`: Extensión de `AbstractUser` con campos personalizados de auditoría y unicidad en correo electrónico.
- `Role`: Definición de roles del sistema.
- `RoleUser`: Tabla intermedia para la asignación de roles a usuarios (`unique_together`).
- `Resource`: Registro de rutas y métodos HTTP protegidos.
- `ResourceRole`: Matriz de asociación entre recursos y roles permitidos.

### ISS-17: Login Abierto (Obtención de Tokens)
- Implementación de `CustomTokenObtainPairSerializer` para inyectar claims personalizados (`username`, `email`) en el payload del token JWT.
- Configuración del endpoint de acceso público en `/api/v1/auth/login/`.

### ISS-18: Refresh Token con Rotación y Blacklist
- Activación de la aplicación `rest_framework_simplejwt.token_blacklist` en `INSTALLED_APPS`.
- Configuración de parámetros en `SIMPLE_JWT`: rotación activada (`ROTATE_REFRESH_TOKENS = True`), invalidación en lista negra tras rotación (`BLACKLIST_AFTER_ROTATION = True`) y tiempos de vida definidos para Access y Refresh tokens.

### ISS-19: Endpoint de Logout (Cierre de Sesión)
- Creación de la vista `LogoutAPIView` en `authentication/views.py` para capturar el `refresh` token enviado en la petición e invalidarlo mediante el método `.blacklist()`.
- Registro del endpoint en `/api/v1/auth/logout/`.

### ISS-20: Perfil del Usuario Autenticado por Token JWT
- Implementación del serializer `UserProfileSerializer` para serializar los datos del usuario en sesión y listar dinámicamente los roles asociados.
- Creación de la vista protegida `UserProfileView` con `permission_classes = [IsAuthenticated]`.
- Registro de la ruta en `/api/v1/auth/me/`.

