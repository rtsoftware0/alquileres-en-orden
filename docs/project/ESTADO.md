# Estado de traspaso — 7 de noviembre de 2026

Documento de continuidad y plan para Claude Code, actualizado el 07/11/2026. El plan está preparado; sus fases de ejecución no están autorizadas conjuntamente.

## Fuente y alcance

V1.1 es el alcance funcional elegido: 175 requisitos en 24 familias, 29 casos A y ocho BP del blueprint. Producto integral para comercializar por suscripción y uso propio, español/EUR, minimalista, apto para una empresa con un único administrador. El usuario no escribe código.

Las copias fechadas de especificación/blueprint/G0 conservan su texto histórico. Las instrucciones humanas posteriores siguientes sustituyen las referencias antiguas a decisiones pendientes, presupuesto o conexiones.

## Decisiones confirmadas

- Continuidad principal en Claude y Claude Code, por aclaración humana del 07/11: «quiero mejorarlo con claude ... cambiar toda la estructura hacia claude y otras tools ... seguir este proyecto con claude». Lovable queda como origen histórico, fuera del flujo habitual. GitHub y Supabase propio se conservan. La arquitectura puede mejorarse por etapas verificadas; no supone una reescritura total autorizada ni una desconexión ejecutada.

- E1–E9, C1–C7 y T1–T6 aprobados el 21/10/2026: fuente humana «Apruebo E, C y T como base inicial». La tabla G0 conserva los detalles completos.
- Basic 19 €/mes, 10 unidades/1 interno/1 GB; Pro 49 €, 50/3/5 GB; Max 99 €, 150/5/15 GB. Enterprise desde 199 € orientativos, oferta individual. Antes de impuestos; no son precios validados por el mercado.
- Prueba Pro o Max: una ventana de 168 horas por empresa, sin tarjeta, sin reinicio al cambiar de plan; 500 MB en prueba. Las políticas de conversión, impago y baja se rigen por T1–T6.
- Presupuesto histórico de 300 €/mes aplazado por el usuario el 21/10: no bloquear preparación por su reparto. Nuevas compras/recargas siguen necesitando autorización específica.
- Diseño definitivo pendiente. Fuente humana del 07/11/2026: «ten en cuenta que el diseño de como se vera la pagina web aun no esta decidido, ahora prepara el plan». Sustituye la consideración anterior de Verde mediterráneo como elección vigente. Esa propuesta y las demás imágenes son referencias de exploración, no una selección final aprobada. Se conserva el objetivo minimalista; paleta, tipografía e identidad quedan por elegir.
- Supabase propio y GitHub autorizados; Lovable Cloud sigue excluido. No hay permiso para usar datos reales de las 150 habitaciones del socio.

## Estado comprobado

- GitHub privado `rtsoftware0/alquileres-en-orden`, `main`, base del plan `368ac240b17fe9a2b262b7168652afdd70aab4ce`; mismo commit observado en Lovable. Preparación anterior: 348 archivos y once cambios documentales/de continuidad verificados en ambos servicios. El guardado del plan añade documentación posterior, sin cambiar código de aplicación.
- Lovable: mismo proyecto/workspace de desarrollo, sin publicar.
- Supabase: `real-estate-dev` / `tskooksubwunfjirvyjz`, organización `disepeeflqxjsxvkowvf`, región `eu-west-3`, ACTIVE_HEALTHY.
- Cliente/config apuntan a ese proyecto. No se han guardado valores de claves en este documento.
- Inventario de solo lectura: ninguna tabla en `public`, ninguna migración registrada, Edge Function ni bucket. Asesor de seguridad sin avisos: una base vacía no equivale a auditoría de aplicación superada.
- Auth, SMTP, MFA, URLs de retorno, login y persistencia desde la app aún no verificados.
- `bun.lock` de GitHub sí incluye Supabase 2.119.0. La copia local del03/11 tenía un lock anterior: no utilizarla como fuente actual.
- Git HTTPS de este Mac no tiene sesión disponible para clonar; el conector GitHub sí permite leer/escribir el repositorio. No se ha creado un clon local completo.

La integración inicial f839 incorporó SDK/cliente/tipos/config; 8ae66f3 añadió el README automático. La documentación del README original reflejaba el primer encargo de octubre y queda sustituida por el estado presente.

## Qué reutilizar y qué falta

Reutilizar pantallas, componentes, formularios, motores de cálculo, datos ficticios de pruebas y arquitectura por funcionalidades. Bloque09 e integración09→10 están entregados como demo: no repetir su recuperación.

Pendiente: modelo de datos y migraciones, aislamiento de empresas y permisos efectivos, autenticación, persistencia/transacciones, archivos privados, comunicaciones, portales reales, automatismos, suscripción del SaaS y derechos en servidor, exportación integral/restauración, revisión y piloto autorizados.

No hace falta crear otro Supabase dev ni una aplicación nueva. El [plan completo para Claude Code](plan-completar-v1-con-claude-code-2026-11-07.md) ordena F00–F12 con cobertura de V1.1/blueprint y una fase propia para elegir diseño. Plan actualizado a v1.1 y [traspaso principal a Claude](traspaso-a-claude-2026-11-07.md). Primer alcance recomendado: T1/F00, reproducir y diagnosticar localmente dependencias de Lovable y calidad; [guion preparado](arranque-claude-code-2026-11-07.md). No se ha ejecutado ni autoriza automáticamente backend, rediseño o publicación. No confundir una pantalla terminada con un requisito operativo superado.

## Pruebas y asuntos abiertos

Histórico sobre código `77920c4df41eb5691e2f79638d5f3da6e139426f`: 37 pruebas focalizadas y403 regresiones en31 archivos; tipos/build correctos. Revisión d447 añadió HANDOFF documental. Se excluyeron `readers-a.test.tsx`, `readers-b.test.tsx` y `account-ui.test.tsx`. Parte de esas pruebas eran auditorías locales, no archivos de este repositorio. No repetir esos números como resultado de una instalación limpia actual.

No se ejecutaron pruebas, tipos/build ni recorrido propio de navegador sobre la revisión actual durante esta preparación.

- READ-A01: preparar pagador con deuda elegible y ejecutar casos restantes.
- READ-B01: seleccionar ámbito didáctico en la prueba.
- READ-B02: coherencia de nombres actuales/históricos en listado y detalle de liquidaciones.
- READ-B03: comprobar contacto nuevo válido y su exclusión del portal.
- CSV03: cambio de formato/entidad mientras se lee archivo.
- CSV04: acceso a todas las advertencias, incluidas las superiores a200.
- ACC-T01: consulta de prueba que encuentra dos avisos válidos.
- PLAN01/02/03 y FORM-B01 cerrados; no reabrir automáticamente.

Los recorridos A01–A29, BP01–BP08 y los manuales del HANDOFF son criterios diseñados; su ejecución completa sigue pendiente. A04 exige prorratear600 € del16/04 al01/05 en300 €. A24 exige restaurar en entorno limpio y comprobar acceso, contrato, saldo, documento y recuentos; un ZIP de código no lo cumple.

## Decisiones abiertas

Diseño final de la aplicación y alcance de una posible web comercial. O1 recorrido prioritario; O4/O5 responsables y financiación de revisión; O6 alojamiento, correo y proveedor de cuota/facturación; O7 piloto y plazo. O2/O3 presupuestarios aplazados. Stripe sigue propuesto, no seleccionado. Concretar informes INF por plan y retención posterior a consulta/exportación antes de implementar esos derechos.

El deseo histórico de entrega el12/11 no es una promesa. No declarar V1 comercial terminada ni porcentaje sin trazabilidad de requisitos.

## Método de continuidad

Verificación futura mediante GitHub y entorno independiente; no exigir relectura en Lovable. Auditado en80c61c7: wrapper `@lovable.dev/vite-tanstack-config@2.26.5`, artefacto en registro de Lovable y hooks `src/lib/lovable-error-reporting.ts`/ruta raíz. Instalación independiente todavía no probada. T2 propondrá su sustitución preservando TanStack/SSR/CSRF, y T3 comprobará independencia. No desconexión ni nuevas herramientas configuradas por esta actualización documental.

Una tarea terminada debe indicar revisión, archivos, comprobaciones ejecutadas y pendientes. La documentación debe acompañar al código. No almacenar datos personales, copias de clientes ni secretos en GitHub.

Guía visual histórica: [HANDOFF](../../src/features/catalog/HANDOFF.md); sus observaciones sobre conexiones se sustituyen por este documento. Las reglas técnicas del repositorio permanecen en AGENTS y las convenciones acordadas en Tools Conventions.
