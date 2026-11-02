# Plan — Paquete de cierre visual (V1)

Base ee2a0b7. Siete tandas secuenciales; cada una es una sola operación con lista cerrada de archivos, verificada por Codex antes de encargar la siguiente. Todo con datos ficticios en memoria React, sin backend, almacenamiento ni envíos.

## Decisión central: catálogo temporal

Hoy `CarteraPage`, `PropertyPage`, `RoomPage`, `ContactsPage`, `ContactPage` importan `demoPortfolio` directamente, y los loaders de `contactos.$contactId`, `cartera.inmuebles.$propertyId` y `cartera.habitaciones.$roomId` lanzan `notFound()` contra ese dataset estático. Unas 70 pantallas más (Dinero, Banco, Planificación, Documentos, Portales, Liquidaciones) también lo leen.

Regla propuesta:
- `demoPortfolio` sigue intacto e inmutable; ningún motor financiero, de contratos, ocupación o portales cambia de fuente.
- Nuevo `CatalogProvider` (memoria React) guarda SOLO altas temporales (contactos propietario/proveedor, inmuebles, habitaciones) y sus ediciones. Los registros del escenario base se muestran en solo lectura con la etiqueta "Registro del escenario base"; no se editan, para evitar pantallas contradictorias (p. ej. Dinero mostrando un nombre y Cartera otro).
- Una vista combinada (`base + altas`) solo la consumen Cartera, Contactos y sus fichas. Las altas llevan la etiqueta "Alta temporal" y un aviso: "No forma parte de contratos, dinero, informes ni portales de la demostración".
- Los consumidores estáticos fuera del catálogo no se tocan: siguen leyendo solo la base, por diseño. Informes generales (tanda 4) calculan sobre la base y lo indican.
- Se monta en `__root.tsx` POR FUERA de `SettlementProvider` (envolviendo `PlanningProvider`), así sobrevive a la navegación y al reinicio de Liquidaciones. Recargar la página lo pierde; aviso persistente en Cartera/Contactos + aviso del navegador al recargar con altas presentes.
- Las rutas de ficha dejan de lanzar `notFound()` en el loader: el componente resuelve el ID contra la vista combinada y muestra `NotFoundMessage` si no existe. El `head()` usa el nombre de la base o un título genérico.
- Una alta de propietario nunca crea acceso de portal; la renta orientativa de una habitación nueva no crea ni altera contratos.

## Tandas

### Tanda 1 — Estado de catálogo y fichas resolubles (sin formularios)
Crear:
- `src/features/catalog/types.ts` — tipos de altas (reutiliza `Contact`, `Property`, `Room`).
- `src/features/catalog/engine.ts` — funciones puras: combinar base+altas, códigos únicos (insensible a mayúsculas/acentos, contra base y altas), validar referencias (propietario con rol propietario, inmueble existente, proveedor con rol proveedor), duplicados por nombre/código.
- `src/features/catalog/CatalogContext.tsx` — provider + hook `useCatalog()` (añadir, editar alta, reiniciar catálogo; base nunca mutada).
- `src/features/catalog/catalog.test.ts`.
Modificar:
- `src/routes/__root.tsx` (envoltura externa).
- `src/routes/contactos.$contactId.tsx`, `src/routes/cartera.inmuebles.$propertyId.tsx`, `src/routes/cartera.habitaciones.$roomId.tsx` (resolución en componente).
- `src/features/portfolio/CarteraPage.tsx`, `PropertyPage.tsx`, `RoomPage.tsx`, `src/features/contacts/ContactsPage.tsx`, `ContactPage.tsx` (leer vista combinada, etiquetas base/alta).
Criterio manual: todo idéntico a hoy sin altas (8/11, 12 habitaciones, 15 contactos); 246 pruebas siguen pasando.

### Tanda 2 — Crear y editar (propietario/proveedor → inmueble → habitación)
Crear:
- `src/features/catalog/ContactForm.tsx`, `PropertyForm.tsx`, `RoomForm.tsx` (crear/editar, cancelar sin cambios, errores con foco).
- `src/routes/contactos.nuevo.tsx`, `src/routes/cartera.inmuebles.nuevo.tsx`, `src/routes/cartera.habitaciones.nueva.tsx` (habitación con `?propertyId` opcional).
- `src/features/catalog/catalog-ui.test.tsx`.
Modificar: `CarteraPage.tsx`, `PropertyPage.tsx`, `RoomPage.tsx`, `ContactsPage.tsx`, `ContactPage.tsx` (botones "Preparar alta"/"Editar alta", solo en altas).
Criterio: crear cadena completa, visitar fichas, editar, cancelar, rechazar código repetido y referencia inválida; ir a Liquidaciones → reiniciar → volver: altas siguen; Portales sin cambios.

### Tanda 3 — Importación CSV local y exportación
Crear:
- `src/features/catalog/csv/templates.ts` (plantillas ficticias contactos/inmuebles/habitaciones).
- `src/features/catalog/csv/import-engine.ts` (Papa Parse ya instalado: separador `,`/`;` detectado o elegido, mapeo de columnas, validación por fila, duplicados contra base+altas+mismo archivo, huella para reimportar sin duplicar).
- `src/features/catalog/csv/export.ts` (CSV generado en el navegador; celdas que empiezan por `= + - @` tab/CR se neutralizan con `'`).
- `src/features/catalog/csv/ImportWizard.tsx` (pegar o elegir archivo local; nada se envía; pasos mapeo → errores → revisión → confirmar en memoria).
- `src/routes/cartera.importar.tsx`.
- `src/features/catalog/csv/csv.test.ts`.
Modificar: `CarteraPage.tsx` (enlace "Importar ejemplo CSV").
Regla: la importación no admite saldos, cobros ni contratos; no suma nada al histórico.

### Tanda 4 — Informes generales `/informes`
Crear:
- `src/features/reports/selectors.ts` (puros, sobre la base y selectores de dinero existentes): ocupación a una fecha elegida con intervalos [entrada, salida); devengado del periodo, cobrado en el periodo (por fecha de pago), deuda pendiente por periodo de origen; gastos coste/pagado/pendiente; resultado por inmueble con desglose. Azahar renta fija sin importe acordado: "No calculable" (nunca 0). A15/A16/copropiedad excluidos.
- `src/features/reports/ReportsPage.tsx` (filtros periodo/inmueble, desglose, exportación CSV con `export.ts`).
- `src/routes/informes.tsx`.
- `src/features/reports/reports.test.ts` (8/11, 1.400 €, 540/170/370, Azahar no calculable, A16 ausente).
Modificar: `src/features/layout/AppShell.tsx` (entrada "Informes"). `/dinero/informes` de Liquidaciones no cambia.

### Tanda 5 — Bienvenida, empresa/perfil/equipo/roles y acceso simulado
Crear:
- `src/features/account/data/demo-account.ts` (empresa ficticia, 3 miembros @example.invalid, roles Administrador/Gestor/Consulta).
- `src/features/account/engine.ts` (puro: cambiar rol/quitar miembro; impedir dejar 0 administradores).
- `src/features/account/AccountContext.tsx` (memoria; fuera de `SettlementProvider`).
- `src/features/account/SettingsPage.tsx`, `WelcomePage.tsx`, `AccessPage.tsx` (entrar y recuperar simulados: sin campo de contraseña, solo correo @example.invalid y mensaje "Simulación: no se envía nada").
- `src/routes/configuracion.tsx`, `src/routes/bienvenida.tsx`, `src/routes/acceso.tsx`.
- `src/features/account/account.test.ts`.
Modificar: `__root.tsx` (provider), `AppShell.tsx` (entrada "Configuración").
Texto fijo: "Los roles de ejemplo no restringen nada; no hay cuentas ni separación real de datos".

### Tanda 6 — Planes y ayuda
Crear:
- `src/features/plans/data/plans.ts` — Basic 19 €/10 unidades/1 interno/1 GB; Pro 49/50/3/5 GB; Max 99/150/5/15 GB; Enterprise desde 199 € orientativo, límites a medida (no ilimitado). €/mes antes de impuestos. Sin asignar INF01–09 ("desglose de funciones pendiente").
- `src/features/plans/engine.ts` — estados puros: prueba Pro/Max única 168 h sin tarjeta ni reinicio, 500 MB; fin sin compra → 30 días consulta/exportación, sin cargo, sin pasar a Basic gratis; impago → 7 días de gracia + 30 consulta/exportación; bajas efectivas al fin de periodo; comprobación de límites contra uso de la base.
- `src/features/plans/PlansPage.tsx` (comparativa, simulador de estado con reloj ficticio; ningún botón de pago real), `src/features/plans/HelpPage.tsx` (preguntas frecuentes y formulario de soporte simulado sin envío).
- `src/routes/planes.tsx`, `src/routes/ayuda.tsx`.
- `src/features/plans/plans.test.ts`.
Modificar: `AppShell.tsx` (entradas "Planes" y "Ayuda").

### Tanda 7 — Revisión conjunta y entrega a Codex
Crear: `src/features/catalog/HANDOFF.md` (rutas nuevas, reglas, recorrido manual completo, límites declarados). Sin cambios de código salvo correcciones que Codex enumere expresamente.

## Recorrido manual por tanda (resumen)
1. Navegar Cartera/Contactos/fichas: cifras base intactas.
2. Alta propietario "Propietaria Ejemplo" → inmueble "Casa Prueba" → habitación PRU-01; código duplicado OLI-01 rechazado; reiniciar Liquidaciones → altas siguen; Portales no muestra nada nuevo; recargar → aviso y altas perdidas.
3. Plantilla → pegar con `;` → mapear → 1 fila errónea señalada → confirmar → reimportar = 0 nuevas; exportar con celda `=SUMA()` neutralizada.
4. `/informes` octubre 2026: 8/11, 1.400 €, 540/170/370; Azahar "No calculable".
5. Quitar rol al último administrador → bloqueado con mensaje.
6. Simular prueba Pro → 168 h → fin → 30 días consulta; no hay segunda prueba.

## Ambigüedades a confirmar (no decididas)
- Edición de registros base: el plan los deja en solo lectura. Alternativa sería permitir solo campos descriptivos con aviso de que otras pantallas muestran el original.
- ¿Las altas deben aparecer en Inicio? Propuesta: no (Inicio refleja el escenario base).
- Rol "proveedor" en altas de contactos: solo propietario y proveedor, como pide el paquete.
- Detalle E/C/T de ayuda: se usarán solo los textos ya confirmados; si faltan, se marcarán "Pendiente".

## Fuera de alcance
Motores financieros/contratos/ocupación, datasets, Banco, Liquidaciones, Portales, dependencias, Knowledge, AGENTS.md, roadmap.md. Sin backend, autenticación real, pagos, envíos, publicación ni accesos reales. Este plan se archivará automáticamente al aprobarse (movimiento registrado, sin tocar código).
