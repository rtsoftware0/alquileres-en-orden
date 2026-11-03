# REAL ESTATE SOFTWARE — Guía de entrega para continuar en Codex

## 1. Identificación

| Dato | Valor |
|---|---|
| Proyecto Lovable | da1c801c-5b5c-4815-9631-ae5b4867f9d3 |
| Workspace | rtsoftware (3d3bfaca737403ac2ecb) |
| Revisión BASE verificada | 77920c4df41eb5691e2f79638d5f3da6e139426f |
| Editor | https://lovable.dev/projects/da1c801c-5b5c-4815-9631-ae5b4867f9d3 |
| Vista previa | https://id-preview--da1c801c-5b5c-4815-9631-ae5b4867f9d3.lovable.app |
| Publicación | No publicado |
| Backend | Ninguno. Lovable Cloud desactivado (nunca activarlo). |
| Carpeta local | `/Users/feezy/Desktop/REAL ESTATE SOFTWARE /work/prototipo-visual/validacion-cierre-v1-2026-11-02/` |

Esta guía se añade después de la revisión base; su propia revisión no se indica aquí.

GitHub y Supabase: el usuario comunica que creó cuentas. No están verificadas ni conectadas al proyecto. No asumir ninguna conexión.

## 2. Qué es

Prototipo visual navegable, en español, con datos ficticios y estado temporal en memoria. No es un producto operativo: no hay persistencia, autenticación real, permisos reales, cobros, envíos ni accesos de terceros.

## 3. Mapa de pantallas

| Ruta | Función |
|---|---|
| `/` | Inicio: resumen de ocupación, pendientes y avisos |
| `/cartera`, `/cartera/inmuebles/nuevo`, `/cartera/inmuebles/$id`, `/cartera/habitaciones/nueva`, `/cartera/habitaciones/$id` | Inmuebles y unidades, alta/edición descriptiva temporal |
| `/cartera/importar` | Asistente CSV local (contactos, inmuebles, unidades) y exportaciones de demostración |
| `/contactos`, `/contactos/nuevo`, `/contactos/$id` | Personas y empresas, alta/edición temporal con aviso de duplicados |
| `/contratos`, `/contratos/$id`, `/contratos/$id/cambios`, `/contratos/borrador` | Contratos de ejemplo y asistente de borrador (no guarda) |
| `/calendario`, `/solicitudes`, `/reservas` (+ fichas y borradores) | Planificación de disponibilidad y solicitudes |
| `/dinero` y subrutas | Resumen, vencimientos, inquilinos, simular cobro, fianzas, gastos, proveedores, banco/extracto, liquidaciones, cierre mensual |
| `/dinero/informes` | Informes financieros del módulo Dinero |
| `/informes` | Informes generales: ocupación, devengo, caja, deuda actual, gastos, resultados orientativos; filtros en URL y CSV del mismo filtro |
| `/incidencias`, `/tareas` | Incidencias, seguimiento simulado, tareas |
| `/documentos`, `/mensajes`, `/avisos` | Biblioteca, hilos (notas internas vs compartidas), avisos con lectura simulada |
| `/portales` | Vistas previas de portal propietario/inquilino/proveedor y compartición de liquidaciones |
| `/configuracion` | Empresa, perfil, equipo, roles descriptivos, invitaciones simuladas (nuevo) |
| `/bienvenida` | Bienvenida inicial simulada (nuevo) |
| `/acceso` | Entrar/recuperar/salir simulados, sin contraseñas (nuevo) |
| `/planes` | Basic/Pro/Max/Enterprise, prueba, cotizaciones y pagos simulados, límites (nuevo) |
| `/ayuda` | Preguntas frecuentes y consulta local no enviada (nuevo) |

Navegación lateral y menú móvil en `src/features/layout/AppShell.tsx`.

## 4. Pila y comandos

TanStack Start v1 + React 19 + Vite 7, Tailwind v4, Vitest + Testing Library. Scripts reales de `package.json`:

| Comando | Uso |
|---|---|
| `npm run dev` (o `bun run dev`) | Servidor local |
| `npm run build` | Compilación |
| `npm run test` | `vitest run` |
| `npm run lint` | ESLint |

La copia local usa dependencias instaladas mediante enlace simbólico. No incluir `node_modules` en ninguna distribución.

### Verificación realizada por Codex (no por Lovable)
Sobre la revisión 77920c4: 37 pruebas de foco (incluidas 3 auditorías independientes) y 403 pruebas de regresión en 31 archivos, excluyendo `readers-a.test.tsx`, `readers-b.test.tsx` y `account-ui.test.tsx`; tipos y build con salida 0. 300 textos locales coinciden con Lovable por bytes/SHA256; 37 binarios omitidos (36 capturas históricas + `public/favicon.ico`). Esto NO equivale a suite completa pasada ni a recorrido de navegador.

## 5. Arquitectura del estado

Orden de providers en `src/routes/__root.tsx`:
`Account → Catalog → Plans → Planning → Bank → Settlement → PortalShare → AppShell`.

- Todo el estado es React en memoria: navegar lo conserva, recargar lo pierde. Sin localStorage, URL de estado (salvo filtros de informes) ni red.
- Cada módulo se reinicia de forma independiente; reiniciar uno no reinicia otros (Planes sobrevive a reset de Cuenta/Catálogo/Liquidaciones).
- Datos base financieros inmutables; el catálogo es una capa temporal por IDs. Códigos y vínculos operativos protegidos; solo se mueve `propertyId` de unidades añadidas sin relaciones.
- Las rentas de unidades nuevas son orientativas, no crean contrato ni cargos. Un registro nuevo no concede acceso a portal.
- Cuenta: una persona con varios roles ocupa 1 plaza; roles descriptivos que no restringen pantallas.
- Planes: prueba Pro/Max de 168 h exactas, única por empresa, 500 MB; impago 7 días de gracia + 30 de consulta desde el vencimiento; cotizaciones ficticias que caducan si el reloj simulado avanza (compra/subida/renovación; la compra durante la prueba conserva el fin original). Los accesos son etiquetas y el simulador C7 no bloquea globalmente otros módulos.

## 6. Invariantes del dataset

| Regla | Valor |
|---|---|
| Inmuebles / habitaciones | 2 (Casa Olivo, Casa Azahar) / 12 |
| Contactos | 15 |
| Ocupación | 8 ocupadas / 11 habilitadas (excluye bloqueada) ≈ 73 % a 21/10/2026 |
| Unidades contadas en Planes | 12 |
| Deuda actual | 1.400 € (septiembre 150 €, octubre 1.250 €) |
| Gastos | coste 540 €, pagado 170 €, pendiente 370 € |

- Ocupación: entrada incluida, salida excluida. Importes en céntimos enteros; fechas ISO con utilidades UTC.
- Caja, devengo y deuda siempre separados; fianzas como ledger aparte; gastos nunca se netean con deuda.
- Casa Azahar sin renta fija: resultado "No calculable"; no usar A16. Contextos didácticos aislados de los totales.
- Perfil vinculado al administrador; el último administrador activo está protegido. No hay autenticación real.

## 7. Recorridos manuales diseñados (NO ejecutados en navegador)

1. Alta de contacto → inmueble → habitación; abrir fichas; reiniciar y comprobar que vuelve la base.
2. CSV: descargar plantilla, importar, revisar errores/avisos, confirmar; reimportar y ver omisión por huella.
3. `/informes`: cambiar mes, fecha de ocupación e inmueble; filtro inválido avisa sin ampliar a cartera; CSV coincide.
4. Configuración: intentar quitar rol/desactivar al único administrador (debe rechazarse).
5. Planes: prueba Max → cotizar Basic al fin → pago verificado → Basic empieza en el fin original.
6. Planes: plan pagado → bajada al fin del periodo → límites inferiores; impago 7 d + 30 d.
7. Ayuda: preparar consulta con `@example.invalid`; nada se envía.

Diseñados no significa ejecutados.

## 8. Pendientes (NO reparados)

| ID | Tipo | Descripción |
|---|---|---|
| READ-A01 | Prueba defectuosa (fixture) | `readers-a.test.tsx:62`: el fixture de pagador no tiene deuda elegible |
| READ-B01 | Prueba defectuosa (fixture) | `readers-b.test.tsx:95`: no cambia al ámbito didáctico |
| READ-B02 | Fallo de visualización | Lista y ficha de Liquidaciones muestran nombre original en fila/título |
| READ-B03 | Cobertura insuficiente | Prueba de alta sin código rechazada no cubre el caso |
| CSV03 | Fuente sin reproducción | Lectura asíncrona: formato/entidad capturados al iniciar la lectura |
| CSV04 | Limitación de visualización | Solo 200 advertencias visibles; el informe no incluye todas |
| ACC-T01 | Prueba defectuosa | `account-ui.test.tsx:87`: consulta ambigua que coincide con 2 avisos válidos de salida |

PLAN01/02/03 ya están corregidos y sus pruebas locales pasan; no están abiertos.

## 9. Alcance real de la V1

V1 visual base amplia; NO es una V1.1 comercial terminada. Falta: persistencia, autenticación, RLS multiempresa, operaciones reales, documentos/envíos reales, cobro SaaS, copias y restauración (A24), rendimiento y piloto.

- E/C/T aprobados el 21/10 (tabla G0 v1.2). INF01–09 exactos, retención, ajustes económicos y O siguen pendientes.
- El diseño Mediterráneo se eligió en otro chat; no está implementado.

### Siguiente paso recomendado
1. Reproducción local y recorridos manuales del apartado 7.
2. Después, preparar P09–P12 concretos con GitHub y Supabase propio del usuario (nunca Lovable Cloud). No ejecutarlo sin autorización específica.

## 10. Evidencias locales

En `work/prototipo-visual/`: `cierre-v1-planes-correccion-{fuente,manifest,integridad,tests,regresion,tipos,build}-2026-11-03.*` y el estado actual. No hay enlaces remotos a esos archivos. No es una exportación completa ni una copia de seguridad del SaaS.
