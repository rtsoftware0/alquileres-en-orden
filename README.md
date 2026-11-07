# REAL ESTATE SOFTWARE — Alquileres en Orden

Base visual de un SaaS integral de gestión de alquileres. Se continúa sobre este código; no comenzar de cero.

**Estado al 7 de noviembre de 2026:** aplicación de demostración amplia, con Supabase propio conectado y repositorio privado sincronizado con Lovable. La V1.1 comercial aún no está terminada.

## Destinos comprobados

- [Proyecto Lovable](https://lovable.dev/projects/da1c801c-5b5c-4815-9631-ae5b4867f9d3): `da1c801c-5b5c-4815-9631-ae5b4867f9d3`, workspace rtsoftware.
- [Repositorio privado](https://github.com/rtsoftware0/alquileres-en-orden): rama `main`.
- Supabase propio de desarrollo: `real-estate-dev`, referencia `tskooksubwunfjirvyjz`, París.
- Sin publicación comercial. No activar Lovable Cloud.

La base se verificó en `8ae66f38a74c4e76447af526e2b98856559612c7`, presente en GitHub y Lovable. Esta entrega posterior corrige documentación y exclusiones de configuración; no añade funcionalidades de backend.

## Qué contiene

Inicio, cartera/unidades, contactos, contratos, calendario/prealquiler, cobros/fianzas/gastos, banco CSV, liquidaciones/cierre, incidencias/tareas, documentos/mensajes, portales, informes, configuración y planes/ayuda.

Los datos de negocio son ficticios y las operaciones de demostración se conservan temporalmente en memoria. Las vistas de acceso, roles, portales y pagos no proporcionan autenticación, autorización ni cobros reales. Supabase conectado no convierte estos módulos en operaciones persistentes.

## Continuar con Claude Code

1. Leer [estado y pendientes](docs/project/ESTADO.md), `AGENTS.md`, `CLAUDE.md` y `Tools Conventions.md`.
2. Consultar [V1.1](docs/project/especificacion-primera-version-2026-10-19.md), [blueprint](docs/project/blueprint-construccion-v1-2026-10-19.md) y [decisiones G0](docs/project/tabla-cierre-g0-2026-10-21.md). Los textos originales fechados deben interpretarse con las actualizaciones posteriores de ESTADO.
3. Verificar revisión, herramientas y arranque en una copia limpia; presentar el plan concreto antes de construir.
4. Trabajar en una rama separada y revisar los cambios antes de integrarlos. No editar simultáneamente la misma rama desde Lovable y Claude ni reescribir historia sincronizada.

Claude Code no hereda las cuentas, conectores, permisos ni historial de esta conversación. Su acceso y el inicio de sesión de Git en el ordenador deben comprobarse por separado.

## Desarrollo y verificaciones

TanStack Start, React 19, TypeScript, Tailwind 4 y Vite. Mantener esta base. Existe `bun.lock` con Supabase 2.119.0; respetar también `bunfig.toml`. No se ha acreditado todavía una instalación limpia de esta revisión en este Mac.

Los scripts existentes permiten `npm run dev`, `npm run test`, `npm run build` y `npm run lint` una vez instaladas las dependencias compatibles. No existe script `typecheck`; la comprobación de tipos se realiza con el TypeScript local. `npm run format` modifica archivos, no es una comprobación de solo lectura.

Las verificaciones históricas corresponden a una revisión anterior y excluyen tres suites. Ver [ESTADO](docs/project/ESTADO.md). No se presentan como pruebas actuales de Supabase ni de la V1 comercial.

No guardar secretos en el repositorio ni compartir claves administrativas con el navegador. Las variables locales quedan excluidas; cualquier ejemplo debe contener solo nombres y valores ficticios.
