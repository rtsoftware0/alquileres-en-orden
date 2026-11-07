# Plan para completar V1.1 con Claude Code

REAL ESTATE SOFTWARE · Versión 1.1 · 7 de noviembre de 2026

**Estado: plan propuesto, pendiente de aprobar sus alcances de ejecución.** Preparar este documento no inicia desarrollo, cambia Supabase, publica el servicio ni contrata herramientas. La instrucción más reciente del usuario confirma que **el diseño definitivo de la web sigue sin decidirse**. Las propuestas anteriores, incluida Verde mediterráneo, son referencias y no una selección aprobada vigente.

## 1. Resultado que buscamos

Convertir la aplicación existente en un SaaS integral de gestión de alquileres que se pueda usar y vender, manteniendo V1.1 como alcance. Aprovechar pantallas, componentes y lógica útil; completar persistencia, seguridad, operaciones económicas, colaboración, suscripciones y recuperación. Claude Code hará el trabajo de código y comprobación; el usuario decidirá producto, diseño y aceptación sin tener que programar.

Decisión humana posterior del 07/11: continuar el proyecto en Claude y Claude Code, mejorar la aplicación y trasladar el flujo habitual a Claude y herramientas independientes. Lovable deja de ser el entorno de construcción o validación previsto. No hace falta terminar V1 en Lovable antes del traslado. La finalización se medirá por requisitos y recorridos demostrados, no por número de pantallas, créditos gastados o mensajes del agente.

El objetivo incluye independizar instalación, compilación, pruebas y publicación de Lovable. Se conservará el código útil y se podrá reorganizar su arquitectura por cambios justificados y verificables. Cambiar de herramienta de desarrollo no exige cambiar de framework, crear otro repositorio o migrar el Supabase propio. Claude no sustituye al alojamiento de la aplicación ni a su base de datos.

## 2. Punto de partida comprobado

| Elemento | Estado al preparar el plan | Consecuencia |
|---|---|---|
| Código | Repositorio privado [rtsoftware0/alquileres-en-orden](https://github.com/rtsoftware0/alquileres-en-orden), rama main; revisión de referencia `368ac240b17fe9a2b262b7168652afdd70aab4ce`, igual en Lovable | Continuar aquí; no crear otra aplicación o repositorio |
| Preparación documental | 348 archivos; once archivos de continuidad/configuración guardados y releídos en ambos servicios en la preparación anterior | Claude dispone de AGENTS, CLAUDE, MEMORY, convenciones, V1.1, blueprint y G0 |
| Actualización de traspaso | La versión inicial de este plan quedó en `80c61c74444943aaf128ae9a60be306a71afdec0`, 350 archivos. Esta actualización documental parte de esa revisión | Leer la revisión vigente; no considerar el traspaso técnico ejecutado por guardar este plan |
| Tecnología | TanStack Start, React 19, TypeScript estricto, Tailwind 4, TanStack Query y Vite; configuración específica de Lovable | Conservarla inicialmente; no proponer una reescritura a otro framework sin evidencia |
| Funciones visuales | Cartera, contactos, contratos, dinero, gastos, banco, liquidaciones, incidencias, tareas, documentos, mensajes, prealquiler, portales, informes, planes y cuenta | Hay una base de interacción y cálculo; no acredita operación real |
| Datos de negocio | Gran parte del estado vive en memoria del navegador y se pierde al recargar; existen ejemplos y fuentes financieras de demostración | Sustituir gradualmente por datos persistentes, sin mezclar demo y producción |
| Supabase | Propio: `real-estate-dev`, referencia `tskooksubwunfjirvyjz`, París, activo. Cliente/config conectados. Auditoría del 07/11: cero tablas públicas, migraciones, funciones y buckets de negocio | Backend de negocio pendiente. No crear otro proyecto dev; no activar Lovable Cloud |
| Acceso y seguridad | Auth, SMTP, MFA, retorno de acceso y persistencia desde la app no comprobados | Conectar Supabase no equivale a disponer de usuarios, empresas o permisos funcionales |
| Ejecución local | El conector GitHub funciona. La clonación local llegó a GitHub, pero falta autenticación de Git en el Mac | Primer paso ejecutable: acceso local y reproducción limpia |
| Diseño | Definitivo pendiente; interfaz actual provisional y conceptos anteriores disponibles como referencias | Elegirlo antes de extender un rediseño por toda la app |
| Publicación | Proyecto Lovable sin publicar | Alojamiento de producción, dominio y salida requieren decisión y aprobación específica |

La revisión citada es la base del análisis; el guardado documental de este plan puede producir una revisión posterior sin modificar código. Leer siempre la revisión real al comenzar cada tarea.

**Límite de las pruebas existentes.** Sobre código histórico `77920c4df41eb5691e2f79638d5f3da6e139426f` se ejecutaron 37 pruebas focalizadas y 403 regresiones en 31 archivos, además de tipos y compilación. Se excluyeron `readers-a.test.tsx`, `readers-b.test.tsx` y `account-ui.test.tsx`; algunas auditorías eran locales y no están en GitHub. No trasladar esas cifras a la revisión actual ni afirmar una instalación limpia actual superada. No se ha completado aceptación A01–A29/BP01–BP08 ni recorrido independiente de navegador sobre esta base.

## 3. Decisiones que se conservan y decisiones abiertas

### Confirmadas

- V1.1 integral, suscripción a terceros y uso propio; una empresa puede trabajar con un único administrador. Español y EUR en esta versión.
- Diseño minimalista, comprensible y adaptable a móvil. **Paleta, tipografía, identidad y aspecto final no elegidos.** No se exige aplicar Verde mediterráneo ni dar por aprobado un tema oscuro final.
- Supabase propio y GitHub existentes; Lovable Cloud excluido. Datos ficticios en desarrollo. Las 150 habitaciones del socio no autorizan acceso a datos personales ni un piloto.
- Claude y Claude Code pasan a ser el entorno principal de continuidad, mejora y desarrollo por instrucción del 07/11. Lovable queda como origen histórico; no se exige usarlo para completar V1. Esta decisión no desconecta servicios, cancela suscripciones ni aprueba una reescritura técnica indiscriminada.
- E1–E9, C1–C7 y T1–T6 aprobados el 21/10 como base inicial. Fuente: «Apruebo E, C y T como base inicial». El detalle completo está en la [tabla G0](tabla-cierre-g0-2026-10-21.md). No volver a presentarlo como pendiente por el texto histórico del 19/10.
- Basic: 19 €/mes, 10 unidades activas, un interno, 1 GB. Pro: 49 €, 50 unidades, tres internos, 5 GB. Max: 99 €, 150 unidades, cinco internos, 15 GB. Enterprise desde 199 € orientativos, oferta y capacidad individuales. Precios antes de impuestos, no validados por mercado.
- Prueba Pro/Max: una ventana de 168 horas por empresa, sin tarjeta, sin reinicio al cambiar de nivel; 500 MB durante prueba. Consulta/exportación 30 días tras vencer sin contratar. Impago: siete días de gracia y después 30 días de consulta/exportación desde la restricción. Sin borrado automático ni Basic gratuito implícito.
- Contratación durante prueba conserva el tiempo restante; el plan pagado empieza al vencimiento original con consentimiento y pago verificado. Subida de pago con importe/fecha confirmados, bajada al fin del periodo pagado y cancelación sin renovación. Conservar historia ante reducción de límites.
- El presupuesto histórico de 300 € se dejó en segundo plano. No bloquear avances documentales por su reparto ni interpretar esto como autorización de gastos nuevos.

### Pendientes, en el momento en que afectan al trabajo

| Decisión | Recomendación para resolverla | Momento |
|---|---|---|
| Diseño final de app | Comparar pocas direcciones sobre las mismas pantallas y elegir con el usuario | F02, antes de extender el sistema visual |
| Web pública comercial | Separarla de la aplicación: posible portada, funciones, precios, acceso y ayuda; extensión concreta por aprobar | Preparación comercial; no añadir un gran sitio o marketplace a V1 por defecto |
| O1 recorrido prioritario | Empezar con habitaciones rent-to-rent ficticias; incluir agencia y patrimonio propio en aceptación | Antes de F04; propuesta de orden, no selección de segmento exclusivo |
| O4/O5 revisión y responsabilidad | Usuario valida producto; socio contrasta negocio; designar persona competente para revisión técnica y jurídica pertinente | Responsabilidad técnica en G1; revisión necesaria antes de datos reales/lanzamiento |
| O6 host, correo y cuota/facturación | Seleccionar por compatibilidad con la app, seguridad, coste real y portabilidad. Stripe sigue siendo candidato | Host en G1; correo antes de acceso externo; pagos antes de F10 |
| Informes por plan | Enumerar INF01–INF09 concretos en Basic/Pro/Max, respetando C aprobado | Antes de programar sus restricciones |
| Conservación posterior | Definir política tras los 30 días de consulta/exportación; no inventar eliminación automática | Antes de automatizar caducidad/baja y vender |
| Copias y servicio | Acordar frecuencia, retención, responsable y objetivos medibles de recuperación y soporte | F07 y antes del piloto |
| O7 piloto y fecha | Participantes autorizados, tamaño, datos permitidos, duración y criterios | Antes de F12 |

O2/O3 presupuestarios siguen aplazados. No requieren un nuevo inventario general de cuentas. El deseo histórico del 12/11/2026 no es una fecha de entrega comprometida.

## 4. Organización del trabajo con Claude Code

Recomendación: usar Claude Code en una carpeta local del repositorio real, con acceso propio comprobado. Claude Desktop permite abrir una carpeta desde su pestaña Code; verificar que la cuenta elegida ofrece esa función. No suponer que las suscripciones de ChatGPT o Lovable conceden acceso a Claude. La autenticación Git local y la de los conectores son independientes. [Guía oficial de inicio](https://code.claude.com/docs/en/desktop-quickstart).

Claude leerá `CLAUDE.md`, `AGENTS.md`, `MEMORY.md`, `Tools Conventions.md`, `docs/project/ESTADO.md`, `docs/project/traspaso-a-claude-2026-11-07.md` y este plan. El wrapper CLAUDE importa AGENTS; comprobar lo que carga realmente, sin crear dos instrucciones maestras contradictorias. Los documentos versionados son la continuidad, no la supuesta transferencia automática del chat o la memoria de otra plataforma. [Memoria de Claude Code](https://code.claude.com/docs/en/memory).

| Herramienta | Papel propuesto |
|---|---|
| Claude Code | Entorno principal para analizar, diseñar, reorganizar, desarrollar, probar y documentar el proyecto |
| Claude, conversación de producto | Planificación y decisiones con el usuario; los acuerdos se guardan en el repositorio para evitar dos memorias contradictorias |
| GitHub | Código y documentación versionados, ramas de trabajo y revisión de diferencias; fuente para reproducir cada entrega |
| Supabase propio | Identidad, base de datos y archivos privados; migraciones y permisos explícitos |
| Navegador local y pruebas de interfaz | Vista previa y comprobación fuera de Lovable; Playwright recomendado para recorridos automáticos, tras revisar herramientas ya presentes |
| Automatización del repositorio | Pruebas y compilación por revisión; configuración y disponibilidad de GitHub Actions por verificar antes de activarlo |
| Alojamiento, correo y cuota SaaS | Proveedores independientes por seleccionar y aprobar cuando corresponda; no son funciones de Claude |
| Lovable | Origen y referencia histórica. Sin encargos nuevos por defecto; no forma parte del flujo necesario |
| Usuario y socio | Decisiones de producto/diseño, contraste de recorridos y autorización de etapas, costes y salida |

Trabajar con un único flujo de escritura sobre cada cambio: Claude Code → rama de trabajo → comprobaciones y revisión → GitHub. La vista previa será local o del alojamiento de prueba independiente. Mientras Git sync siga conectado, los commits de la rama vinculada pueden seguir apareciendo en Lovable; eso no lo convierte en una dependencia del desarrollo ni en una verificación obligatoria. No generar cambios desde Lovable en paralelo. Desconectar Git sync o cancelar su plan se decidirá expresamente después de comprobar independencia; no borrar proyecto ni reescribir historial. Una rama Git no crea otra base de datos. [Sincronización Git de Lovable](https://docs.lovable.dev/integrations/git-sync-overview).

### Traspaso técnico antes de ampliar V1

- **T0, continuidad preparada:** código/documentación en el repositorio existente, instrucciones orientadas a Claude y decisiones vigentes. Se guarda con este plan; no acredita una sesión de Claude conectada.
- **T1, F00 inicial:** abrir el repositorio en Claude Code, verificar acceso real a archivos/Git/Supabase dev, instalar y diagnosticar. Las conexiones de esta sesión no se trasladan automáticamente; comprobar permisos concretos y evitar secretos en documentación. [Conexiones de Claude Code](https://code.claude.com/docs/en/mcp), [MCP oficial de Supabase](https://supabase.com/docs/guides/ai-tools/mcp).
- **T2, alcance separado tras el diagnóstico:** independizar herramientas de desarrollo/compilación y mejorar la estructura necesaria. En la revisión `80c61c7`, `package.json` y `vite.config.ts` usan `@lovable.dev/vite-tanstack-config@2.26.5`; el lock obtiene ese artefacto de un registro de Lovable. Existe además `src/lib/lovable-error-reporting.ts`, llamado desde `src/routes/__root.tsx`, con hooks del editor. No se ha probado aún una instalación limpia de ese artefacto: no declarar bloqueo sin medirlo.
- En T2, sustituir el wrapper por configuración oficial equivalente si resulta necesario para eliminar la dependencia, y retirar/inactivar hooks específicos del editor. Mantener TanStack Start/React, renderizado del servidor, protección CSRF de `src/start.ts`, rutas y reglas de negocio. No duplicar plugins mientras el wrapper siga activo ni quitarlo sin reconstruir sus funciones. Revisar también `bunfig.toml`, variables y salida de compilación.
- **T3, independencia demostrada:** instalar, arrancar, comprobar tipos/tests, compilar y previsualizar sin sesión de Lovable; guardar una revisión de código desde Claude y releerla en GitHub. Probar después alojamiento independiente autorizado. Retirar dependencias evitables solo tras revisar regresión. El cierre administrativo de Lovable, si se quiere, es otra acción específica.

El traspaso se cierra con una aplicación reproducible, accesos comprobados en Claude y un procedimiento que pueda continuarse sin este chat ni el editor Lovable. No basta con entregar un ZIP o decir que Claude leyó un documento. Las capacidades de alojamiento y portabilidad se comprobarán para este proyecto concreto. [Portabilidad oficial de Lovable](https://docs.lovable.dev/tips-tricks/deployment-hosting-ownership), [pruebas de navegador con Playwright](https://playwright.dev/docs/intro).

Cada encargo tendrá CONTEXTO, OBJETIVO, COMPORTAMIENTO ESPERADO, ALCANCE exacto, NO TOCAR y RESTRICCIONES. Para funciones complejas: análisis sin cambios, revisión y ejecución del alcance aprobado. No pedir a un agente «terminar toda V1» en una sola operación. Un fallo de comprobación se registra y bloquea solo la parte dependiente; se pueden continuar tareas independientes ya aprobadas. Dos intentos fallidos del mismo arreglo obligan a detener ese arreglo y explicar lo conocido.

## 5. Qué conservar, mejorar y añadir

| Conservar tras comprobar | Mejorar | Añadir |
|---|---|---|
| Arquitectura por funcionalidades, rutas y componentes útiles | Separar pantallas, reglas de negocio y acceso a datos | Modelo de datos versionado y migraciones reproducibles |
| Formularios, filtros, tablas y navegación existentes | Estados de carga/error/vacío, validación y conflictos de edición | Sesiones reales, empresas, miembros, permisos y auditoría |
| Motores de fechas, céntimos, reparto, conciliación y liquidación | Verificar reglas y llevar operaciones sensibles a transacciones del servidor | Persistencia, idempotencia y protección frente a concurrencia |
| Ejemplos ficticios como material de pruebas | Aislar modo demostración y eliminar dependencia del reloj local para derechos | Archivos privados, correo, tareas programadas y reintentos |
| Portales y comparador como base visual | Sustituir selectores simulados de perfil por autorizaciones efectivas | Suscripción, pago de nuestra cuota, límites y soporte real |
| Bloque09 y unión09→10 ya guardados | Resolver solo pendientes reproducidos, sin regenerar bloques completos | Exportación integral, copias, restauración y despliegue controlado |

### Arquitectura recomendada para evitar rehacer módulos

1. Diseñar el mapa de entidades completo antes de implementar tablas por tandas: empresas, miembros, carteras, inmuebles/unidades, contactos y vínculos, candidatos/reservas, contratos/versiones/ocupaciones, obligaciones, caja, asignaciones, fianzas, gastos/repartos/pagos, banco/conciliaciones, liquidaciones/versiones/cierres, incidencias/tareas, archivos/versiones/comparticiones, mensajes/avisos, derechos de plan y auditoría.
2. Partir de `src/features/` y `src/routes/`, evaluar su acoplamiento y reorganizar lo necesario por etapas demostrables. Introducir una capa de servicios/acceso a datos con límites por funcionalidad; su estructura exacta se acordará leyendo el código en F01. No congelar por principio decisiones del prototipo ni reescribirlo todo sin comparación. Evitar llamadas aisladas a Supabase desde cada botón.
3. Toda operación identifica empresa, usuario, rol, cartera y relación autorizada. Probar permisos con usuarios reales de prueba y peticiones directas, no únicamente con una conexión administrativa. RLS en tablas expuestas y controles equivalentes para funciones, vistas y archivos. [RLS oficial](https://supabase.com/docs/guides/database/postgres/row-level-security), [seguridad de Storage](https://supabase.com/docs/guides/storage/security/access-control).
4. Adaptar Auth al renderizado de TanStack Start; el cliente con almacenamiento local creado por la conexión no completa el modelo de sesión del servidor. No confiar en datos de perfil editables para autorizar, ni enviar claves privilegiadas al navegador. [Auth con servidor](https://supabase.com/docs/guides/auth/server-side).
5. Importes exactos y operaciones atómicas: deuda, cobro, asignación y conciliación separados; reversión e historia; clave de repetición y restricciones de base de datos para impedir duplicados. Fechas de estancia separadas de instantes, zona horaria explícita y reloj de servidor para la prueba.
6. Correos y eventos externos mediante cola/registro de intentos: guardar la operación de negocio aunque falle el envío, reintentar sin duplicarla. Configurar proveedor de correo antes del uso externo; el servicio SMTP predeterminado tiene limitaciones de desarrollo. [SMTP de Supabase](https://supabase.com/docs/guides/auth/auth-smtp).
7. Desarrollar con migraciones versionadas, datos ficticios y destinos de prueba claramente identificados. Ensayar reconstrucción de esquema y actualización antes de aplicar al entorno compartido; no modificar producción como método de experimentación.
8. Probar alojamiento compatible con TanStack Start y su configuración actual de Vite/Nitro. No tratarlo como una web estática genérica ni asumir que publicar en Lovable respeta automáticamente la decisión de excluir Cloud. Selección y despliegue se aprobarán por separado. [Alojamiento de TanStack Start](https://tanstack.com/start/latest/docs/framework/react/guide/hosting).

## 6. Fases propuestas y criterios de salida

Las fases siguientes reorganizan P01–P64 según lo ya construido. No sustituyen sus requisitos ni autorizan su ejecución conjunta. F02 puede avanzar en paralelo al análisis de F01/F03; las fases de negocio comparten la base segura. Las pruebas se incorporan en cada fase y se reúnen en F11.

### F00 — Reproducir y diagnosticar la aplicación actual

**Prerrequisito:** acceso local a Git y a Claude Code; intervención humana solo para autenticación si hace falta. **Ámbito:** repositorio existente, documentación y configuración local; sin cambios de negocio, base remota ni dependencias para ocultar fallos.

- Clonar la revisión vigente y comprobar rama, origen y archivos; no partir del ZIP histórico o de una carpeta parcial.
- Usar el gestor y lock actuales, verificar versión/runtime y realizar instalación limpia. `bun.lock` actual sí contiene Supabase: no reparar una ausencia inexistente. No cambiar a otro gestor por comodidad.
- Ejecutar comprobación de tipos, compilación y batería disponible; registrar comando, revisión y resultado. Enumerar pruebas ausentes/excluidas y los fallos reales, sin eliminarlos para obtener verde.
- Recorrer las principales pantallas localmente, con datos ficticios, incluida recarga y móvil. Capturar qué funciona y qué solo simula.
- Clasificar READ-A01, READ-B01–03, CSV03/04 y ACC-T01: fallo de producto, preparación de prueba o resultado desconocido. Corregirlos en encargos acotados posteriores; no reabrir PLAN01–03 ni FORM-B01 cerrados sin una regresión nueva.

**Entrega:** informe de base reproducible, dependencias de Lovable, inventario de comandos y fallos, cobertura por módulo y propuesta T2 para independizar el proyecto. Después del traspaso técnico se concreta F01. **Salida:** sabemos arrancar y comprobar la revisión exacta, o tenemos un bloqueo reproducible claramente delimitado. Esta fase no promete que todo el código pase ya ni incluye reemplazar dependencias sin revisar el alcance.

### F01 — Modelo de datos y demostración técnica mínima

**Prerrequisito:** F00 y traspaso T2/T3 en lo necesario para desarrollar de forma independiente; elegir responsable de revisión y concretar alojamiento de prueba antes de desplegar. **Blueprint:** P05–P16, con G1 aún pendiente hasta demostrar la cadena completa.

- Preparar primero el modelo de relaciones, dinero, estados, permisos, importación y auditoría; revisión antes de migraciones de negocio.
- Definir interfaces de acceso a datos y plan de conversión desde los proveedores de estado actuales. Separar fixtures de demostración y datos persistentes.
- Implementar, tras aprobación, una cadena mínima: inicio de sesión, empresa aislada, registro privado, archivo privado y recuperación del registro tras recargar.
- Probar compilación/despliegue de una revisión exacta en destino de prueba autorizado, separación respecto de producción y regreso a la versión anterior. Un enlace GitHub o un cliente Supabase no bastan para G1.

**Ámbito propuesto:** `src/integrations/supabase/`, `supabase/`, proveedores de datos y punto de entrada; rutas concretas se fijarán en el análisis. **Salida G1:** cadena ejecutada, aislamiento mínimo y publicación de prueba/retorno demostrados, sin declarar aún todo G2. Si alojamiento o aprobación siguen pendientes, marcar G1 parcial y continuar solo trabajo independiente autorizado.

### F02 — Decidir el diseño y crear el sistema visual

**Prerrequisito:** entender recorridos y limitaciones de F00. **Blueprint:** P21–P24. Puede prepararse sin esperar a todos los módulos de backend.

- Seleccionar dos o tres direcciones a comparar; reutilizar las imágenes anteriores si sirven, sin imponerlas. Definir identidad, densidad, navegación, color, tipografía y prioridad de información.
- Enseñar las mismas tareas en Inicio, Cartera, Contrato, Dinero, portal de inquilino y Planes, con ejemplos en ordenador y móvil. El usuario elige antes de aplicar un rediseño global.
- Convertir la elección en componentes y reglas comunes: tablas, formularios progresivos, filtros, fichas, avisos, diálogos, estados y gráficos. Comprobar teclado, foco, contraste, legibilidad y uso sin depender solo del color.
- Revisar por separado si hace falta una web comercial pública y qué páginas tendrá; no confundirla con el área privada ni con un portal de anuncios.

**Ámbito:** estilos y componentes compartidos, `src/features/layout/AppShell.tsx`, pantallas representativas. **Salida:** decisión visual humana registrada y muestra navegable aprobada; después se extiende a los módulos conforme se completen. La arquitectura de datos puede avanzar aunque la elección visual siga pendiente.

### F03 — Cuenta, empresas, permisos y archivos privados

**Prerrequisito:** modelo F01; reutilizar el mínimo ya demostrado, sin duplicarlo. **Blueprint:** P13–P20; ACC, SEG y DOC.

- Alta por invitación, verificación/recuperación/cierre de sesión, caducidad de invitaciones y preferencias. Empresa activa visible para quien pertenece a varias.
- Administrador, gestor, finanzas y consulta; unión explícita de funciones y alcance por cartera. Relaciones externas sin convertir un contacto en usuario automáticamente.
- RLS y controles de lectura/escritura/búsqueda/exportación; revocación efectiva y MFA requerido antes de producción para administradores/operadores.
- Almacenamiento privado, autorizaciones de subida/descarga, enlaces de vida limitada y auditoría. Protección del último administrador y trabajo sin compañeros obligatorios.

**Ámbito:** `src/features/account/`, integración Supabase, nuevas migraciones/políticas y componentes de acceso. **Salida G2:** A01 con tres empresas, BP01 base y BP02; intentar IDs ajenos desde peticiones directas y verificar que no revelan contenido. Documentar y acotar la vida residual de enlaces ya emitidos.

### F04 — Cartera, contactos e importación operativa

**Prerrequisito:** F03 y recorrido inicial acordado. **Blueprint:** P25–P28; CAR, CT e IMP.

- Persistir inmuebles, viviendas/habitaciones, unidades gestionables, contactos con varias funciones y relaciones; archivo sin pérdida histórica y reglas de fusión de duplicados.
- Filtros, paginación, fichas y límites de unidades sin contar dos veces la vivienda contenedora.
- Importación con mapeo, prevalidación, informe de errores completo, revisión y confirmación; reimportación sin duplicados y operación recuperable.
- Completar contratos y obligaciones/saldos iniciales en el flujo de importación conforme a IMP: fecha de corte, origen de cada saldo y prevención de volver a sumar el histórico. Las pantallas CSV actuales no acreditan ese alcance completo.
- Reproducir CSV03 al cambiar entidad/formato durante lectura lenta; resolver CSV04 para acceder a advertencias más allá de las primeras 200.

**Ámbito:** `src/features/catalog/`, `portfolio/`, `contacts/` y migraciones/servicios asociados. **Salida:** A02 con dos viviendas/doce habitaciones, recarga sin pérdida, reimportación estable y ninguna lectura ajena. Validar por separado las importaciones dependientes de contratos/dinero cuando F05/F06 estén disponibles; no declarar todo IMP cerrado antes.

### F05 — Disponibilidad, prealquiler y contratos reales

**Prerrequisito:** F04 y modelo económico definido. **Blueprint:** P29–P32; PRE, CON y REG.

- Candidatos, solicitudes, calendario, reservas con vencimiento y conversión en contrato sin doble ocupación; detectar conflicto vivienda completa frente a habitaciones. Caducar libera disponibilidad; repetir conversión abre el mismo borrador, no crea otro.
- Borrador/activación y estados contractuales, participantes, documentos y condiciones; historial y cambios con fecha efectiva.
- Renta nueva, prórroga, cambio de habitación y salida; preservar pasado y limitar acceso del ocupante nuevo al tramo autorizado.
- Comprobar simultaneidad, febrero, cambio horario, entrada incluida y salida excluida.

**Ámbito:** `src/features/planning/`, `contracts/`, cartera y servicios de ocupación. **Salida:** A03, A04, A13 y A14 en lo contractual, BP07; dos sesiones no reservan/activan el mismo periodo incompatible. El cumplimiento financiero de A13 se completa en F06.

### F06 — Motor económico persistente

**Prerrequisito:** F03–F05. **Blueprint:** P33–P36; FIN, FIA, GAS y REG. Dividir en tandas: obligaciones; cobros/asignaciones; fianzas; gastos/repartos; correcciones/cierres.

- Obligaciones recurrentes idempotentes, vencimientos del 1 al 28, prorrateo por días naturales y generación con fecha efectiva.
- Cobros parciales, asignación a varias deudas, exceso sin asignar, devolución/reversión y auditoría; no sumar caja dos veces.
- Fianzas separadas de renta/margen; recepción, aplicación y devolución conforme a la especificación.
- Gastos con responsable económico, justificante, reparto, repercusión y pagos separados. Redondeo por línea y reparto exacto de céntimos.
- Transacciones completas o sin efecto, control de concurrencia, bloqueo de periodos cerrados y reapertura motivada. Generaciones programadas observables y reintentables.

**Ámbito:** `src/features/money/`, contratos, servicios financieros y migraciones. **Salida:** A04–A10, A13, A20 y BP06/BP07; contrastar cálculos con una referencia independiente. Ejemplos: 400 de 600 deja 200; recibir 650 deja 50 sin asignar; 100 entre tres da 33,34 + 33,33 + 33,33. No confundir caja, ingreso y saldo.

### F07 — Operación diaria, exportación y recuperación: candidato V0

**Prerrequisito:** núcleo seguro y económico. **Blueprint:** P37–P40 y adelanto P56–P58, porque G3 exige recuperación antes del piloto.

- Incidencias completas, responsable, presupuestos, aprobación y gasto vinculado una sola vez; tareas, prioridades, vencimientos y seguimiento.
- Documentos originales/versiones, validación de contenido/tipo/tamaño en servidor, revisión y permiso explícito antes de compartir; conversaciones, notas internas diferenciadas, avisos y correo con registro de entrega/error/reintento. Subir no equivale a compartir; entrega técnica de correo no acredita lectura.
- Exportación integral de una empresa: tablas legibles, IDs/relaciones, originales y manifiesto; excluir otras empresas. Ampliarla cada vez que se añada un módulo.
- Copias independientes de datos, objetos y configuración necesaria; restaurar en entorno limpio con correos/cobros externos desactivados. Los backups de base de Supabase no contienen los objetos de Storage. [Copias oficiales](https://supabase.com/docs/guides/platform/backups).

**Ámbito:** `src/features/incidents/`, `docs/`, `planning/`, mensajería existente, servicios de envío y exportación/recuperación. **Salida G3:** recorrido unipersonal desde alta hasta cobro/gasto/incidencia, A17, A21, A23, A24 y BP08 con evidencia. Objetivos de pérdida máxima de 24 h y recuperación en un día laborable siguen propuestas a acordar y medir. G3 no autoriza datos reales por sí solo.

### F08 — Banco CSV, liquidaciones y cierre

**Prerrequisito:** F06 y base operativa. **Blueprint:** P41–P45; BAN, LIQ y REG.

- Importar movimientos de banco, detectar repetidos y conciliar contra cobros/pagos existentes sin duplicarlos; soporte de agrupaciones, parciales y deshacer con decisión explícita sobre caja.
- Liquidación de agencia sobre renta recibida y asignada en el mes; honorario fijo o porcentaje, gastos y saldo del propietario. Relaciones de copropiedad con reparto que suma 100 % y redondeo trazable.
- Rent-to-rent: obligación al propietario separada del margen del operador, devengo/caja/pendiente distintos.
- Versiones, aprobación, pagos parciales, cierre y reapertura auditados; conservar la versión compartida. Resolver coherencia de nombres actuales/históricos de READ-B02 sin reescribir documentos cerrados.

**Ámbito:** `src/features/bank/`, `settlements/`, `reports/` y motor económico. **Salida:** A11–A12 y A15–A16; agencia 1.000 − 100 − 50 = 850 y margen rent-to-rent 2.400 − 1.500 − 200 − 100 = 600. Bloque09 visual se reutiliza; no volver a generarlo. No incluye banca automática ni transferir dinero.

### F09 — Portales reales e informes contrastables

**Prerrequisito:** F03 y operaciones que se mostrarán; decisiones INF por plan antes de aplicar sus derechos. **Blueprint:** P44–P47 y P55.

- Acceso real de propietario e inquilino en Pro; proveedor en Max. Invitación, aceptación, revocación y alcance por relación/periodo, sin selector de perfil que conceda permisos.
- Mostrar al propietario solo versiones aprobadas/compartidas; al inquilino su contrato y saldo; al proveedor sus incidencias y presupuestos. Excluir notas internas y datos ajenos.
- Completar INF01–INF09 sobre datos persistentes; totales, desglose, fechas/filtros y exportación deben coincidir. Verificar con casos de agencia, rent-to-rent y patrimonio propio.
- Comprobar que contactos nuevos válidos no aparecen como invitados automáticamente, incluida READ-B03 con datos de entrada correctos.

**Ámbito:** `src/features/portals/`, `reports/`, comparticiones, consultas y políticas asociadas. **Salida:** A14, A18–A19, BP02 y conciliación informe→detalle→exportación; navegación móvil de inquilino desde saldo hasta incidencia con foto.

### F10 — Suscripciones, derechos y soporte del SaaS

**Prerrequisito:** catálogo E/C/T vigente, matriz INF definida, proveedor de cuota/facturación seleccionado y política de conservación acordada para sus automatismos. **Blueprint:** P48–P52; SaaS y SOP.

- Catálogo/condiciones versionados y tabla única de funciones/capacidades y derechos efectivos en servidor; interfaces respetan lo mismo. Controlar límites también con altas simultáneas. La comprobación de plan no puede existir solo en un botón oculto.
- Prueba de 168 horas por empresa, sin reinicio; reloj de servidor, avisos, límites y consulta/exportación según T. Un proceso programado retrasado no prolonga la prueba. Verificar derechos en consultas, informes, exportaciones específicas y tareas programadas, preservando la exportación de salida acordada. Mantener reloj de demostración separado.
- Cuota del propio SaaS: contratación, consentimiento, prueba, confirmación de pago, subida, bajada, cancelación e impago. Integración primero en modo de prueba; firmas de eventos, repetición, desorden y reintento controlados.
- Configuración Enterprise individual sin introducir funciones excluidas ni capacidades ilimitadas. Conservación y exportación de datos tras pérdida de derechos.
- Ayuda contextual, solicitudes de soporte, administración de servicio limitada y acceso excepcional autorizado, temporal y auditado. No prometer atención 24/7 sin capacidad.

**Ámbito:** `src/features/plans/`, `account/`, endpoints de eventos y tareas de servicio. **Salida:** A22, A26–A29, BP03/BP06 y funcionamiento con un solo administrador. Cobrar nuestra cuota no significa cobrar alquileres para clientes. Activar pagos reales será otra autorización concreta.

### F11 — Integración completa y versión candidata

**Prerrequisito:** funciones anteriores integradas y diseño elegido aplicado. **Blueprint:** P53–P58; salida G4 técnica.

- Cerrar la matriz de 175 requisitos con vínculo a implementación y evidencia; ningún requisito se marca completo solo por tener una pantalla.
- Ejecutar A01–A29 y BP01–BP08, distinguiendo los controles que aún necesitan el entorno de salida. Repetir regresión pertinente y batería completa de la candidata; resolver o justificar con aprobación los pendientes.
- Revisar permisos, sesiones, vistas/funciones privilegiadas, archivos, logs sin secretos, dependencias, carga lenta, errores de guardado, accesibilidad y navegación móvil.
- Medir escenario de 150 unidades, 36 meses, tres empresas y diez sesiones. Pactar operaciones, datos y medición antes: p95 inferior a tres segundos es objetivo propuesto, no capacidad certificada.
- Actualizar y volver a ensayar exportación/restauración con todos los módulos, incluida suscripción/configuración necesaria. Preparar revisión independiente y expediente de hallazgos.

**Salida:** candidata identificada por revisión de código y migraciones, evidencia completa, cero críticos/altos para pasar a lanzamiento, pendientes menores aceptados expresamente. Si faltan pruebas, registrar G4 parcial; no denominar V1 vendible a una demo completa.

### F12 — Preparación de producción, piloto y lanzamiento gradual

**Prerrequisito:** candidata revisada, recuperación probada, responsables/proveedores elegidos y autorizaciones específicas. **Blueprint:** P59–P64; G5 y G6.

- Preparar entorno de producción separado, configuración/secretos, dominio/correo/alertas, publicación manual de revisión exacta y retorno probado. No hacer que cualquier push de Lovable publique producción.
- Revisar condiciones, privacidad, tratamiento de datos, conservación, facturación de nuestra cuota y soporte con profesionales pertinentes. La región europea y un proveedor de pagos no acreditan cumplimiento por sí solos.
- Ejecutar piloto limitado con participantes y datos autorizados; contrastar un ciclo completo contra referencia independiente. Si se simula un cierre por falta de tiempo natural, dejarlo declarado.
- Confirmar saldos, aislamiento, recuperación, tareas sin asistencia continua, incidencias y esfuerzo de soporte. Incluir cada modelo de gestión que se pretenda dar por validado.
- Autorizar por separado apertura comercial, pagos reales y comunicaciones; abrir altas gradualmente con alertas y responsable de respuesta.

**Salida G5/G6:** evidencias de piloto y revisiones, versión de producción controlada, soporte y recuperación practicables. No hay lanzamiento automático al terminar F11. La web comercial se incorpora solo con su alcance aprobado.

## 7. Registro de comprobaciones y pendientes actuales

| Pendiente conocido | Tratamiento previsto |
|---|---|
| READ-A01 | Preparar pagador con deuda elegible; ejecutar casos restantes, sin atribuir al producto un fixture inválido |
| READ-B01 | Seleccionar el ámbito de ejemplo correcto antes de buscar participantes |
| READ-B02 | Verificar nombres actuales frente a instantáneas históricas de liquidación y acordar presentación |
| READ-B03 | Crear contacto válido, incluido código requerido, y comprobar exclusión del portal |
| CSV03 | Reproducir lectura asíncrona lenta y cambio de entidad/delimitador |
| CSV04 | Comprobar acceso a todas las advertencias y reporte completo por encima de 200 |
| ACC-T01 | Acotar consulta del test que encuentra dos mensajes válidos; comprobar comportamiento real |

Ninguno se convierte en fallo confirmado por aparecer en esta lista. Su resolución no justifica repetir todos los bloques. Mantener PLAN01/02/03 y FORM-B01 cerrados mientras no haya evidencia nueva.

Cada prueba tendrá: ID, requisito, revisión, migración, entorno, datos ficticios, resultado esperado/observado, fecha, ejecutor y evidencia. Estados distintos: **diseñada**, **ejecutada y superada**, **ejecutada y fallida**, **no ejecutada**. Lectura de código, informe del agente y prueba ejecutada son evidencias diferentes.

**A04:** renta de 600 €, entrada 16/04 incluida y salida 01/05 excluida: 15 días de abril, 600 × 15/30 = 300 €. No es una regla de meses de 30 días; febrero y meses de 31 tienen su denominador natural. Debe verificarse en contrato, obligación, persistencia y reintentos.

**A24:** recuperar en entorno limpio y poder entrar, ver contrato, saldo y documento con recuentos/relaciones coherentes. Debe incluir identidades/configuración y originales de archivos, con efectos externos desactivados. Un ZIP de código o una copia de tablas sin documentos no lo satisface.

## 8. Cobertura completa y aceptación

Esta tabla mantiene las 24 familias y los 175 requisitos de V1.1; no afirma que estén ejecutados. Al desarrollar se desglosará cada ID en una fila de seguimiento con evidencia. El detalle normativo está en la [especificación V1.1](especificacion-primera-version-2026-10-19.md) y el [blueprint P01–P64](blueprint-construccion-v1-2026-10-19.md).

| Familia | Fases | Blueprint | Verificación principal |
|---|---|---|---|
| ACC01–09 | F01/F03/F11 | P13–P20 | A01, BP01–02; acceso, MFA y recuperación |
| UX01–14 | F02 y cada módulo | P21–P24 | Móvil, teclado, errores, estados y uso observado |
| IMP01–09 | F04–F06/F07 | P25–P28 | A02, A23; errores, saldos/contratos y reimportación |
| CAR01–09 | F04/F05 | P25–P32 | A02–03, A14; archivo e historia |
| CT01–04 | F04/F09 | P26/P46 | A01, A18–19; roles y relaciones |
| PRE01–06 | F05 | P29–P32 | A03, BP07; caducidad y conversión |
| CON01–10 | F05/F06 | P29–P36 | A03–04, A13–14 |
| FIN01–09 | F06 | P33–P36 | A05–08, A13, A20 |
| FIA01–03 | F06 | P35–P36 | A09; separación de renta y caja |
| GAS01–08 | F06/F07 | P35–P37 | A10, A17; reparto/repercusión/reversión |
| BAN01–09 | F08/F10 | P41–P43 | A11–12 y permisos de plan |
| LIQ01–09 | F08/F09 | P44–P45 | A15–16; versiones y cierre |
| INC01–08 | F07/F09 | P37–P40 | A17, A19, BP01 |
| TAR01–02 | F07 | P37–P40 | Responsable, fecha y cumplimiento |
| DOC01–06 | F03/F07/F09 | P38–P40/P56 | A19, A23, BP02 |
| COM01–05 | F07/F09 | P39–P40 | A21; notas internas y reintentos |
| POR01–06 | F09 | P46–P47 | A14, A18–19, BP02 |
| INF01–09 | F08/F09/F11 | P44–P47/P55 | A15–16, A25; total/desglose/exportación |
| SaaS01–13 | F10 | P48–P52 | A22, A26–29, BP03/BP06 |
| SOP01–02 | F10/F12 | P52/P62–P64 | Ayuda, solicitud, incidente y mantenimiento |
| REG01–10 | F01/F05/F06/F08 | P13–P16/P30–P45 | A04–16, A20, BP07 |
| SEG01–07 | F01/F03/F11/F12 | P13–P20/P53–P61 | A01, A19–22 y revisión de seguridad |
| BAK01–04 | F07/F11/F12 | P56–P58 | A23–24, BP08 |
| CAL01–04 | F00/F11/F12 | P53–P55/P62–P64 | A25 y expediente de calidad |

Los 29 casos cubren: aislamiento (A01), importación (A02), ocupación (A03), prorrateo (A04), cobros/asignación/exceso/devolución (A05–08), fianzas (A09), reparto (A10), banco (A11–12), cambios contractuales (A13–14), liquidaciones/margen (A15–16), incidencia (A17), portales/archivos (A18–19), concurrencia (A20), correo (A21), eventos de suscripción (A22), exportación/restauración (A23–24), rendimiento (A25) y prueba/derechos/cambio de plan (A26–29).

BP01–08 añaden empresa unipersonal, revocación, frontera temporal de prueba, separación de entornos, publicación/retorno, repetición/desorden de eventos, fechas/simultaneidad y restauración completa. BP04/BP05 necesitan probar los destinos reales autorizados; no marcarlos superados por una captura o por dos ramas Git.

## 9. Qué significa terminar y cómo se entrega cada fase

| Hito | Evidencia necesaria | Situación inicial |
|---|---|---|
| G0 Definición | V1.1 y E/C/T vigentes, decisiones operativas necesarias resueltas | Parcial; O pendiente, presupuesto aplazado |
| G1 Viabilidad | Reproducción + acceso/registro/archivo aislados + alojamiento de prueba y retorno | Conexiones hechas; demostración completa pendiente |
| G2 Base segura | Empresas, roles, archivos y administrador único probados | Pendiente |
| G3 Núcleo fiable/V0 | Contratos, dinero, operación, exportación y restauración demostrados | Pendiente |
| G4 V1 funcional completa | Todas las familias y suscripción aceptadas, candidata comprobada | Pendiente |
| G5 Piloto | Participación autorizada y ciclo contrastado | Pendiente |
| G6 Venta y operación | Revisiones, publicación, cobros, soporte y recuperación aprobados | Pendiente |

Por cada alcance: diferencias revisables, lista de archivos, revisión anterior/nueva, migraciones aplicadas si procede, pruebas realmente ejecutadas con resultados, demostración manual y pendientes. Releer cambios guardados y actualizar memoria/estado. Verificar en GitHub y en el entorno independiente; no exigir una réplica en Lovable para dar por guardado un cambio futuro. El mensaje de finalización de cualquier agente no sustituye los archivos y su revisión. No almacenar secretos, documentos de clientes o copias de la base en el repositorio.

Para producción: manual de alta y baja, facturación de nuestra cuota, copia/restauración, publicación/retorno, soporte e incidentes; responsable y alertas de fallos de correo, generación, eventos, copias y límites. Volver al código anterior y restaurar datos son operaciones diferentes; ensayarlas por separado, con cambios de esquema compatibles.

No se fija una fecha completa antes de reproducir la base y medir F01/F06. El calendario histórico de 10–18 semanas era una estimación del proyecto completo, no una estimación actual del trabajo restante con Claude. Reestimar con resultados, capacidad humana de revisión y decisiones de proveedores. Para acelerar, paralelizar diseño y tareas independientes; no quitar pruebas de dinero, aislamiento o recuperación.

## 10. Fuera de esta V1 y siguientes decisiones

Mantener fuera: conexiones bancarias automáticas, cobro de rentas con tarjetas/SEPA, transferencias a propietarios, custodia de fondos, firma certificada, sistema fiscal propio, scoring, marketplace público de alquileres, channel manager turístico, apps nativas, dominio por cliente, WhatsApp/SMS/push, API pública, contabilidad a medida, funciones de IA para clientes, modo sin conexión y multimoneda. Enterprise no los incorpora implícitamente.

**Primer alcance recomendado en Claude: T1/F00.** Autenticar Git local si es necesario, abrir el repositorio actual en Claude Code, instalar de forma reproducible, ejecutar comprobaciones y entregar diagnóstico concreto de calidad/independencia. Presentar después T2, con los cambios exactos de configuración/estructura a realizar; completar el traspaso antes de ampliar los módulos F01–F12. No rediseñar ni corregir masivamente en el diagnóstico. El diseño final se decide mediante F02; Claude puede mejorarlo y ejecutarlo cuando se elija.

Guion de arranque preparado en [arranque de Claude Code](arranque-claude-code-2026-11-07.md). Es una instrucción reutilizable para el alcance F00 cuando se autorice, no una prueba de que se ha ejecutado.

## 11. Fuentes y alcance de esta entrega

Fuentes del proyecto leídas: AGENTS, MEMORY, Tools Conventions, V1.1, blueprint, tabla G0, estado de entrega del 03/11, código/documentación auditados y preparación GitHub/Supabase del 07/11. Las referencias históricas a falta de conexiones, decisiones E/C/T pendientes o diseño elegido se interpretan con las instrucciones humanas posteriores indicadas aquí.

Fuentes técnicas oficiales consultadas para la preparación y el plan: [Claude Desktop](https://code.claude.com/docs/en/desktop), [buenas prácticas de Claude Code](https://code.claude.com/docs/en/best-practices), [Lovable y GitHub](https://docs.lovable.dev/integrations/github), y la documentación enlazada en las decisiones técnicas. Volver a comprobar versiones/capacidades al implementar; ninguna fuente demuestra que esta aplicación haya pasado sus pruebas.

Esta entrega prepara y guarda el plan y corrige la continuidad visual. No añade módulos, no cambia tablas/políticas, no activa pagos, no compra herramientas y no publica el servicio. Las pruebas de software de la revisión vigente siguen pendientes de ejecución local.
