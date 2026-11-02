# ClimaTec — Frontend

Aplicación web de ClimaTec para la gestión del servicio técnico de refrigeración. Este frontend se desarrolla por ISS y se adapta a la API Django del repositorio; no es la tienda StoreLab de la guía académica.

## Stack

- Angular 22 standalone, con Signals y arranque sin Zone.js.
- PrimeNG 22 con el tema Aura.
- Tailwind CSS 4.
- TypeScript en español para las pantallas y documentación del proyecto.

## Desarrollo

Usa Ubuntu/WSL, donde se instalaron Node.js `24.15.0`, npm `11.12.1` y Angular CLI `22.2.5`.

```bash
npm install
npm start
```

La aplicación de desarrollo estará en `http://localhost:4200/`. El login aparece en `/login`; las rutas autenticadas comparten un shell responsivo con menú PrimeNG y las páginas de clientes, equipos y órdenes. La vista demostrativa sin API está en `/demo`. Las instrucciones y evidencias de cada unidad están en [`proceso.md`](./proceso.md).

## API ClimaTec

El backend Django está en [`../../Backend-2026/Django/`](../../Backend-2026/Django/). Su base de API es `http://localhost:8000/api/v1`, centralizada en `src/app/config/api.config.ts`; las rutas REST terminan en `/` y el JSON utiliza camelCase. Los modelos TypeScript del contrato están en `src/app/models/climatec.ts`. Los endpoints de negocio requieren autenticación JWT y permisos RBAC. Swagger está en `http://localhost:8000/api/docs/`.

El login espera la respuesta de perfil de Django; el interceptor usa el access token, renueva el par rotado ante un `401` y reintenta la petición una sola vez. El cierre de sesión invalida el refresh token en el backend. Estos contratos están cubiertos por pruebas HTTP del frontend y de Django; aún falta una sesión de navegador con una cuenta autorizada. Los listados iniciales de clientes, equipos y órdenes son de consulta, no CRUD completos. El proxy de desarrollo se configura en `proxy.conf.json`.
