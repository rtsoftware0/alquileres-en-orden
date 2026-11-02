# Plan — Paquete de cierre visual (V1) · revisión 2

Base de código ee2a0b7 (revisión 15574d1 solo añadió el plan). Nueve tandas secuenciales; cada una es una sola operación con lista cerrada de archivos y la verifica Codex antes de encargar la siguiente. Lovable no avanza a la siguiente tanda por su cuenta. Todo con datos ficticios en memoria React, sin backend, almacenamiento, red ni envíos.

## 1. Arquitectura del catálogo temporal (decisiones resueltas)

### 1.1 Capa superpuesta
- `demoPortfolio` sigue inmutable. Nuevo `CatalogProvider` guarda una capa superpuesta en memoria: `added` (contactos, inmuebles, unidades nuevos) y `edits` (cambios descriptivos por ID sobre registros base o nuevos).
- `mergeCatalog(base, overlay)` (función pura) devuelve un `PortfolioDataset` en el que solo cambian `contacts`, `properties` y `rooms`. Todas las demás colecciones (contratos, cargos, cobros, asignaciones, fianzas, gastos, incidencias, documentos, solicitudes, reservas) son las MISMAS referencias de la base. Por eso los selectores existentes aplicados a esta vista dan los mismos importes que hoy. Las unidades nuevas no tienen movimientos, así que suman 0 € y aparecen como "Sin movimientos".
- `useCatalogData()` expone esa vista y `useCatalogLabels()` expone las etiquetas (`propertyName`, `propertyCode`, `roomCode`, `contactName`) resueltas desde la capa.
- Se monta en `__root.tsx` envolviendo a `PlanningProvider`, por fuera de `SettlementProvider`: sobrevive a la navegación y al reinicio de Liquidaciones. Al recargar se pierde, con un aviso persistente en Cartera y Contactos más el aviso del navegador al recargar si la capa no está vacía. También habrá un botón "Restablecer catálogo de ejemplo".

### 1.2 Qué se puede editar (base y nuevos)
Editable en registros base y nuevos:
- **Contacto:** nombre, tipo persona/empresa, correo @example.invalid, teléfono ficticio, dirección ficticia y nota. Roles: se pueden AÑADIR todos (inquilino, propietario, arrendador, proveedor, avalista, candidato), y hay varios a la vez. Código de contacto: editable si es único.
- **Inmueble:** nombre, dirección ficticia, tipo, cartera, sociedad y responsable interno (texto descriptivo).
- **Unidad:** renta orientativa, superficie, tipo, capacidad, características y nota.

Protegido (solo lectura con explicación "Vinculado a contratos, dinero u ocupación"):
- IDs de todo registro.
- Códigos de inmuebles y habitaciones BASE: forman parte de conceptos bancarios, del orden del reparto de gastos (los céntimos sobrantes van al primer código) y de las huellas de liquidaciones. En registros nuevos sí son editables y únicos.
- `ownerId` de inmuebles base (titularidad operativa: portales, liquidaciones). En inmuebles nuevos, el propietario es editable entre contactos con rol propietario.
- `propertyId` y `status` de las unidades: la ocupación se deriva de contratos, reservas y bloqueos. Una unidad nueva nace "disponible"; su inmueble se fija al crearla y solo cambia mientras no tenga relaciones (en la demo, nunca las tiene).
- Quitar un rol que tiene una relación viva (contrato como inquilino/arrendador/avalista, gasto o incidencia como proveedor, inmueble como propietario, solicitud como candidato): se bloquea con el motivo. Quitar roles sin relación sí se permite.
- La renta orientativa nunca altera `rentCents` de contratos.
- Ninguna alta o edición crea, cambia ni revoca accesos de portal.

### 1.3 Tipos compatibles (campos opcionales, base sin cambios)
- `Contact`: `phone?: string` (ficticio) y `address?: string` (ficticia).
- `Property`: `kind?: "vivienda" | "edificio" | "local"`, `portfolioLabel?: string` (cartera), `companyLabel?: string` (sociedad), `managerName?: string` (responsable).
- `Room` (unidad): `unitKind?: "habitacion" | "vivienda_completa" | "estudio"`, `capacity?: number`. `areaM2` y `monthlyRent` ya existen.
Se añaden en `src/features/catalog/types.ts`, como extensiones (`CatalogContact`, `CatalogProperty`, `CatalogRoom`) compatibles con los tipos actuales. `portfolio/data/types.ts` no se toca.

### 1.4 Cifras y coherencia
- Sin capa: Inicio, Cartera e Informes muestran 8/11 (≈73 %), 12 gestionadas y deuda de 1.400 €.
- Con N unidades nuevas: disponibles en el denominador, con el texto explícito "8 de 11+N habilitadas (incluye N altas temporales)". La deuda sigue en 1.400 € y cada alta muestra 0 €.
- Si una magnitud no tiene regla o historial (resultado de un inmueble nuevo sin acuerdo, renta fija de Azahar sin importe), se muestra "No calculable" o "Sin movimientos", nunca 0 inventado.

### 1.5 Lectores descriptivos de otros módulos
- **Pantallas que solo muestran datos** (listas, fichas, resúmenes): cambian `import { demoPortfolio as data }` por `const data = useCatalogData()`. Los importes no cambian porque las colecciones económicas son idénticas.
- **Motores y contextos con estado** (siguen con `demoPortfolio`, sin migrar): `bank/simulator.ts`, `bank/data/demo-bank.ts`, `planning/simulator.ts`, `portals/PortalShareContext.tsx`, `settlements/engine.ts` y `settlements/adapters.ts`. Sus pantallas usan `useCatalogLabels()` solo para mostrar nombres, y la revalidación de accesos sigue sobre la base (`ownerId` está protegido, así que no diverge).
- **Instantáneas inmutables** (versiones de liquidación, cierres): muestran la etiqueta actual del catálogo al lado del código protegido. Sus importes y huellas no cambian.
- **`head()` de rutas**: las que hoy titulan con el nombre de un contacto o inmueble pasan a un título neutro que no puede contradecir una edición ("Ficha de contacto · …", "Ficha de inmueble · …", "Ficha de unidad · …").
- **Rutas de ficha del catálogo**: el loader deja de lanzar `notFound()` contra la base y el componente resuelve el ID en la vista combinada. Así no hay falsos 404 para las altas, y los IDs inexistentes muestran `NotFoundMessage`.

### 1.6 Formularios
- Altas en rutas propias: `/contactos/nuevo`, `/cartera/inmuebles/nuevo` y `/cartera/habitaciones/nueva?propertyId=…` (las rutas estáticas tienen prioridad sobre `$id`). Al terminar, llevan a la ficha nueva.
- Edición en un panel dentro de la propia ficha ("Editar datos descriptivos"). "Cancelar" descarta el borrador sin tocar la capa. Los errores llevan el foco al campo.
- Validación pura: códigos únicos (sin distinguir mayúsculas ni acentos, contra base y capa), nombre duplicado con aviso y confirmación, referencias válidas (propietario con rol propietario), correo @example.invalid.

## 2. Tandas (listas cerradas)

`src/routeTree.gen.ts` figura en las tandas que crean rutas. Se regenera automáticamente y no se edita a mano.

### Tanda 1 — Estado del catálogo y lecturas base (sin formularios ni otros módulos)
Crear:
- `src/features/catalog/types.ts`
- `src/features/catalog/engine.ts` (merge, etiquetas, validaciones puras, protección de campos y roles)
- `src/features/catalog/CatalogContext.tsx` (`CatalogProvider`, `useCatalog`, `useCatalogData`, `useCatalogLabels`, restablecer, aviso al recargar)
- `src/features/catalog/catalog.test.ts`

Modificar:
- `src/routes/__root.tsx`
- `src/routes/contactos.$contactId.tsx`
- `src/routes/cartera.inmuebles.$propertyId.tsx`
- `src/routes/cartera.habitaciones.$roomId.tsx`
- `src/features/portfolio/CarteraPage.tsx`
- `src/features/portfolio/PropertyPage.tsx`
- `src/features/portfolio/RoomPage.tsx`
- `src/features/contacts/ContactsPage.tsx`
- `src/features/contacts/ContactPage.tsx`

Criterio: con la capa vacía, todo idéntico a hoy (8/11, 12 unidades, 15 contactos). Las pruebas del motor cubren el merge, la protección y el denominador 11+N. Las 246 pruebas existentes no cambian.

### Tanda 2 — Altas y edición descriptiva
Crear:
- `src/features/catalog/ContactForm.tsx`
- `src/features/catalog/PropertyForm.tsx`
- `src/features/catalog/RoomForm.tsx`
- `src/routes/contactos.nuevo.tsx`
- `src/routes/cartera.inmuebles.nuevo.tsx`
- `src/routes/cartera.habitaciones.nueva.tsx`
- `src/features/catalog/catalog-ui.test.tsx`

Modificar:
- `src/routeTree.gen.ts` (generado)
- `src/features/portfolio/CarteraPage.tsx`
- `src/features/portfolio/PropertyPage.tsx`
- `src/features/portfolio/RoomPage.tsx`
- `src/features/contacts/ContactsPage.tsx`
- `src/features/contacts/ContactPage.tsx`

Criterio: crear la cadena propietario → inmueble → unidad, editar un registro base (nombre de Casa Olivo y renta de OLI-05), cancelar sin cambios, rechazar el código OLI-01 repetido, bloquear quitar "propietario" a con-009 y ver protegidos los campos vinculados.

### Tanda 3 — Lectores descriptivos A (Inicio, Contratos, Dinero)
Modificar:
- `src/features/dashboard/DashboardPage.tsx`
- `src/features/contracts/ContractsPage.tsx`
- `src/features/contracts/ContractPage.tsx`
- `src/features/contracts/DraftWizard.tsx`
- `src/features/money/MoneySummaryPage.tsx`
- `src/features/money/ChargesPage.tsx`
- `src/features/money/ChargePage.tsx`
- `src/features/money/TenantAccountsPage.tsx`
- `src/features/money/TenantAccountPage.tsx`
- `src/features/money/SimulatorPage.tsx`
- `src/features/money/DepositsPage.tsx`
- `src/features/money/DepositPage.tsx`
- `src/features/money/ExpensesPage.tsx`
- `src/features/money/ExpensePage.tsx`
- `src/features/money/ExpenseDraftWizard.tsx`
- `src/features/money/PaymentSimulatorPage.tsx`
- `src/features/money/ProviderAccountsPage.tsx`
- `src/features/money/components/MoneyUi.tsx`
- `src/routes/dinero.inquilinos.$contactId.tsx` (título neutro)
- `src/routes/dinero.proveedores.$contactId.tsx` (título neutro)
- `src/features/catalog/readers-a.test.tsx` (nuevo)

Criterio: Inicio muestra 8/11 sin capa y 8/12 con una alta. El nombre editado de Casa Olivo aparece igual en Inicio, Contratos y Dinero. Importes sin cambios.

### Tanda 4 — Lectores descriptivos B (Incidencias, Documentos, Planificación, Banco, Liquidaciones, Portales)
Modificar:
- `src/features/incidents/IncidentsPage.tsx`
- `src/features/incidents/IncidentPage.tsx`
- `src/features/incidents/IncidentDraftWizard.tsx`
- `src/features/incidents/TasksPage.tsx`
- `src/features/docs/DocsPage.tsx`
- `src/features/docs/DocPage.tsx`
- `src/features/docs/DocDraftWizard.tsx`
- `src/features/docs/ThreadsPage.tsx`
- `src/features/docs/ThreadPage.tsx`
- `src/features/docs/NoticesPage.tsx`
- `src/features/docs/components/RelatedDocs.tsx`
- `src/features/planning/CalendarPage.tsx`
- `src/features/planning/ApplicationsPage.tsx`
- `src/features/planning/ReservationsPage.tsx`
- `src/features/planning/ContractChangePage.tsx`
- `src/features/planning/PlanningUi.tsx`
- `src/features/bank/BankPage.tsx`
- `src/features/settlements/DetailPage.tsx`
- `src/features/settlements/PreparePage.tsx`
- `src/features/settlements/ClosingPage.tsx`
- `src/features/settlements/ReportsPage.tsx`
- `src/features/portals/PortalViews.tsx`
- `src/features/portals/PortalsPage.tsx`
- `src/features/layout/AppShell.tsx` (nombre de empresa vía catálogo, si lo lee de la base)
- `src/features/catalog/readers-b.test.tsx` (nuevo)

No se tocan: `bank/simulator.ts`, `bank/data/demo-bank.ts`, `planning/simulator.ts`, `portals/PortalShareContext.tsx`, `settlements/engine.ts`, `settlements/adapters.ts`. Criterio: etiquetas coherentes. Liquidaciones, conciliación y visibilidad de portales dan resultados idénticos (las 246 pruebas siguen pasando).

### Tanda 5 — Importación CSV local y exportación
Crear:
- `src/features/catalog/csv/templates.ts`
- `src/features/catalog/csv/import-engine.ts` (Papa Parse ya instalado)
- `src/features/catalog/csv/export.ts`
- `src/features/catalog/csv/ImportWizard.tsx`
- `src/routes/cartera.importar.tsx`
- `src/features/catalog/csv/csv.test.ts`

Modificar:
- `src/routeTree.gen.ts`
- `src/features/portfolio/CarteraPage.tsx`
- `src/features/contacts/ContactsPage.tsx`

Reglas:
- Plantillas ficticias de contactos, inmuebles y unidades.
- Separador `,`/`;` detectado o elegido, mapeo de columnas, errores por fila y revisión antes de confirmar en la capa.
- Una huella por fila evita duplicados al reimportar.
- No admite saldos, cobros, contratos ni roles con relaciones, y nunca suma nada al histórico.
- El archivo solo se lee en el navegador.
- La exportación neutraliza las celdas que empiezan por `= + - @`, tabulador o retorno de carro.

### Tanda 6 — Informes generales `/informes`
Crear:
- `src/features/reports/selectors.ts`
- `src/features/reports/ReportsPage.tsx`
- `src/routes/informes.tsx`
- `src/features/reports/reports.test.ts`

Modificar:
- `src/routeTree.gen.ts`
- `src/features/layout/AppShell.tsx` (entrada "Informes")

Reglas:
- Leen `useCatalogData()`: las altas cuentan en la ocupación como disponibles y muestran 0 € o "Sin movimientos".
- Ocupación a una fecha con intervalos [entrada, salida).
- Devengo del periodo, cobros del periodo por fecha de pago y deuda pendiente por periodo de origen, por separado.
- Gastos 540/170/370; resultado por inmueble con desglose.
- Azahar renta fija sin importe: "No calculable". A15/A16/copropiedad excluidos de cartera.
- Exportación con `export.ts`. `/dinero/informes` no cambia.

### Tanda 7 — Bienvenida, empresa/perfil/equipo/roles y acceso simulado
Crear:
- `src/features/account/data/demo-account.ts`
- `src/features/account/engine.ts`
- `src/features/account/AccountContext.tsx`
- `src/features/account/SettingsPage.tsx`
- `src/features/account/WelcomePage.tsx`
- `src/features/account/AccessPage.tsx`
- `src/routes/configuracion.tsx`
- `src/routes/bienvenida.tsx`
- `src/routes/acceso.tsx`
- `src/features/account/account.test.ts`

Modificar:
- `src/routeTree.gen.ts`
- `src/routes/__root.tsx` (provider fuera de `SettlementProvider`)
- `src/features/layout/AppShell.tsx` (entrada "Configuración")

Reglas:
- Roles Administrador, Gestor, Finanzas y Consulta; miembros ficticios @example.invalid.
- Recorrido de administrador único: no se puede degradar ni quitar al último administrador, con el mensaje y el foco en el aviso.
- Entrar y recuperar son simulados: sin campo de contraseña, solo un correo @example.invalid y el texto "Simulación: no se envía nada". El texto fijo dice que los roles de ejemplo no restringen nada ni separan datos.

### Tanda 8 — Planes y ayuda
Crear:
- `src/features/plans/data/plans.ts`
- `src/features/plans/engine.ts`
- `src/features/plans/PlansPage.tsx`
- `src/features/plans/HelpPage.tsx`
- `src/routes/planes.tsx`
- `src/routes/ayuda.tsx`
- `src/features/plans/plans.test.ts`

Modificar:
- `src/routeTree.gen.ts`
- `src/features/layout/AppShell.tsx` (entradas "Planes" y "Ayuda")

Datos confirmados (€/mes antes de impuestos):

| Plan | Precio | Unidades | Usuarios internos | Almacenamiento |
|---|---|---|---|---|
| Basic | 19 € | 10 | 1 | 1 GB |
| Pro | 49 € | 50 | 3 | 5 GB |
| Max | 99 € | 150 | 5 | 15 GB |
| Enterprise | desde 199 €, orientativo | a medida, no ilimitado | a medida | a medida |

Motor puro con reloj ficticio UTC:
- Prueba de Pro/Max única de 168 h, sin tarjeta y sin reinicio, con 500 MB.
- Contratar durante la prueba conserva la fecha de fin y el plan de prueba hasta el vencimiento.
- Las subidas se aplican tras un pago verificado simulado; las bajadas y cancelaciones, al fin del periodo.
- Impago: 7 días de gracia y luego 30 días de consulta/exportación.
- Prueba vencida sin compra: 30 días de consulta/exportación, sin cargo y sin Basic gratis.
- Límites comprobados contra el uso de la vista del catálogo.

Pendiente visible: "Funciones por plan (INF01–09) y retención final pendientes de definir". Ningún botón de pago real; el soporte es un formulario simulado sin envío.

### Tanda 9 — Revisión conjunta y entrega a Codex
Crear: `src/features/catalog/HANDOFF.md` (rutas, reglas de capa y protección, recorridos manuales, límites). Correcciones de código solo si Codex las enumera expresamente en ese encargo.

## 3. Recorridos manuales clave
1. Capa vacía: 8/11, 1.400 €, 540/170/370 en Inicio, Cartera e Informes.
2. Crear propietario "Propietaria Ejemplo" (persona, roles propietario y avalista) → "Casa Prueba" → PRU-01. Inicio muestra 8/12 con la nota de altas; la deuda sigue en 1.400 €; Portales sin accesos nuevos.
3. Renombrar Casa Olivo: el mismo nombre aparece en Cartera, Inicio, Contratos, Dinero, Incidencias, Documentos, Calendario, Banco, Liquidaciones y Portales; importes y huellas idénticos.
4. Intentar editar el código OLI-01 o el propietario de Azahar: protegidos con motivo. Quitar el rol proveedor a un proveedor con gasto: bloqueado.
5. Reiniciar Liquidaciones: la capa se conserva. Recargar: aviso y capa perdida.
6. CSV con `;`: una fila errónea señalada → confirmar → reimportar = 0 nuevas; exportar `=SUMA()` neutralizado.
7. Último administrador protegido; Finanzas asignable.
8. Prueba Pro → contratar durante la prueba → sigue Pro (prueba) hasta 168 h → activo; prueba vencida sin compra → 30 días de consulta; segunda prueba denegada.

## 4. Fuera de alcance
Motores financieros, de contratos, ocupación, conciliación y liquidaciones; datasets; dependencias; Knowledge; AGENTS.md; roadmap.md. Sin backend, autenticación real, pagos, envíos, publicación ni accesos reales.
