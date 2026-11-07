# Guía funcional de la primera versión del software de alquileres

> Actualización de decisiones — 21/10/2026: el usuario aprobó E, C y T como base inicial en [tabla-cierre-g0-2026-10-21.md](tabla-cierre-g0-2026-10-21.md), v1.1. Esa aprobación sustituye las menciones históricas de pendiente para las reglas económicas, catálogo y mecánica de prueba cubiertos por E1–E9, C1–C7 y T1–T6. O sigue pendiente y G0 abierto. No autoriza construcción ni acciones externas. El inventario general de identidades/cuentas se omite por instrucción del 21/10. El texto original que sigue y las copias Word conservan su contexto del 19/10.

REAL ESTATE SOFTWARE · Documento 2 · Versión 1.1 · 19 de octubre de 2026

Esta guía propone todo el alcance de la primera versión comercial para que puedas revisarlo y decidir qué añadir, cambiar o quitar. Incluye una gestión conectada de cartera, candidatos, contratos, cobros, gastos, incidencias, informes y portales, con empresas cliente separadas y venta por suscripción.

Los requisitos expresan el comportamiento que deberá cumplir el software. Los cuatro planes Basic, Pro, Max y Enterprise, la prueba gratuita de siete días en Pro y Max y un diseño minimalista, fácil de usar y atractivo son requisitos confirmados por el usuario. El reparto de funciones, precios, límites, reglas detalladas de prueba y paleta concreta siguen siendo propuestas para revisión. El análisis competitivo adjunto explica cómo se relacionan con la oferta de Homming.

La V1 se construirá mediante ChatGPT Pro y Work, Lovable, Supabase propio y GitHub. Los socios no tendrán que escribir código, aunque será necesario configurar servicios y revisar técnicamente el resultado antes de operar con datos reales. El socio financiará las herramientas; las identidades, permisos y copias de continuidad se organizarán conforme al plan de cuentas ya preparado.

## 1 Cómo revisar y usar esta guía

Cada requisito tiene un identificador estable. Puedes responder, por ejemplo: «CON 04: quiero otra regla para el cambio de habitación» o «aplazar el portal de proveedores». Conservaremos esos identificadores al revisar la versión para no perder decisiones.

V1 significa primera versión comercial propuesta. V0 significa piloto de una parte de V1. Posterior significa que la función no se incluye en el compromiso de V1. Una dependencia externa necesita proveedor, cuenta, configuración, pruebas y coste aprobado; no se considera resuelta por aparecer en una lista de integraciones.

| Versión | Qué se podrá hacer | Condición de avance |
|---|---|---|
| V0 piloto | Empresas separadas, usuarios internos, cartera, contactos, contratos, dinero manual, incidencias, exportación y recuperación | Pruebas de permisos y cálculos superadas; uso acotado autorizado |
| V1 comercial | Todos los módulos incluidos en esta guía, con sus límites declarados | Portales, automatismos, suscripción propia, soporte y revisión técnica aceptados |
| Posterior | Ampliaciones de la sección 21 | Decisión nueva y presupuesto |

V0 no es una versión comercial equivalente a Homming. La aceptación de una pantalla no implica que todos sus procesos, permisos y errores hayan sido probados.

Para modificar el alcance, registrar requisito, texto anterior, texto nuevo, motivo y efecto en coste o plazo. El Word sirve para comentarios; después se actualizará el Markdown autoritativo del proyecto. No mantener dos versiones incompatibles como aprobadas.

## 2 Usuarios objetivos y límites de uso

El producto debe contemplar tres modelos operativos: gestor de patrimonio propio; agencia que gestiona inmuebles de propietarios; operador rent-to-rent que paga una renta al dueño y alquila unidades. No se selecciona aquí un único segmento comercial definitivo. La fase de validación determinará cuáles comprarían la primera entrega.

| Modalidad | Alcance V1 propuesto | Límite |
|---|---|---|
| Vivienda completa | Unidad con contrato, obligaciones y gastos | Sin solaparla con alquiler simultáneo de sus habitaciones |
| Habitaciones | Vivienda con varias unidades y contratos independientes | Sin gestión de camas compartidas en V1 |
| Temporada | Contrato con fechas, disponibilidad y dinero | Sin validar automáticamente la causa o legalidad del contrato |
| Turismo | Clasificación y registro administrativo básico si se necesita | Sin promesa de PMS turístico, channel manager, comunicaciones oficiales o reservas por noches |
| Otros activos | Tipo descriptivo configurable sin lógica especializada | Sin funcionalidades sectoriales para naves, terrenos o alquiler con opción a compra |

Propuesta inicial de idioma: español. Moneda operativa: EUR. Interfaz de fechas DD/MM/AAAA; almacenamiento de fechas contractuales sin zona horaria y eventos en UTC, mostrando la zona de la empresa, inicialmente Europe/Madrid. Multidivisa, traducciones y fiscalidad internacional quedan para después.

Cartera objetivo de prueba: 150 habitaciones ficticias, con varias viviendas y al menos tres empresas cliente. Es una referencia de validación, no un límite técnico demostrado ni una garantía de rendimiento para cualquier volumen.

## 3 Acceso y estructura de empresas

Una empresa cliente es el espacio cuyos datos quedan aislados. Una sociedad o cartera dentro de esa empresa permite clasificar operaciones, pero no debe usarse para mezclar clientes independientes. Los propietarios de las cuentas técnicas son los socios; el administrador de una empresa usuaria solo administra su propio espacio.

| Código | Requisito V1 |
|---|---|
| ACC 01 | Alta de empresa por invitación, nombre, datos de contacto, zona horaria, moneda y modalidad de gestión |
| ACC 02 | Inicio de sesión, verificación de correo, recuperación de contraseña y cierre de sesión |
| ACC 03 | Invitaciones con caducidad, aceptación y rol explícito; revocación por administrador |
| ACC 04 | Un usuario puede pertenecer a varias empresas y debe cambiar de contexto de forma visible |
| ACC 05 | Toda consulta y operación comprueba empresa, rol y relación con el registro |
| ACC 06 | Desactivar un miembro corta su acceso sin borrar el historial de sus acciones |
| ACC 07 | Segundo factor para administradores internos y operadores del servicio antes de producción |
| ACC 08 | Auditoría de altas, cambios de rol, exportaciones y operaciones financieras relevantes |
| ACC 09 | Perfil y preferencias de notificación; datos de identificación mínimos para usar la cuenta |

No basta con filtrar por empresa en el navegador. Las políticas de base de datos y archivos deben impedir accesos directos indebidos. Las funciones privilegiadas verifican igualmente la identidad y el alcance solicitado. Soporte no tendrá acceso universal silencioso; cualquier acceso excepcional tendrá autorización, duración y registro.

### Roles fijos de la primera versión

| Rol | Alcance permitido | Restricciones |
|---|---|---|
| Administrador de empresa | Miembros, configuración y toda la cartera propia | Sin datos de otras empresas |
| Gestor | Cartera asignada, contratos, candidatos e incidencias | Sin administración de miembros ni aprobar liquidaciones |
| Finanzas | Cobros, gastos, conciliación, cierre e informes de su empresa | Sin administrar permisos |
| Consulta | Lectura de cartera asignada e informes autorizados | Sin edición ni exportación masiva por defecto |
| Propietario externo | Unidades vinculadas, informes aprobados y documentos compartidos | Sin notas internas ni datos de otros propietarios |
| Inquilino externo | Su contrato, saldo, documentos compartidos e incidencias | Sin información de otros ocupantes |
| Proveedor externo | Incidencias que tenga asignadas y presupuestos propios | Sin rentas, contratos completos o datos financieros ajenos |

Un usuario interno puede recibir varias funciones con unión explícita de permisos. La asignación a carteras limita el alcance efectivo; no puede ampliar el rol. El catálogo de roles personalizables queda aplazado. Si el tamaño del equipo impide separar tareas, el administrador puede aprobar su propia operación, conservando el registro; no se promete doble aprobación obligatoria en todos los casos.

Aceptación ACC: con dos empresas y dos propietarios, probar lecturas, escrituras, búsquedas, descargas, exportaciones y enlaces directos. Intentar reutilizar un identificador ajeno debe fallar sin revelar contenido. Revocar a un usuario y comprobar su siguiente petición y sus accesos a archivos.

## 4 Navegación y experiencia de uso

Menú interno propuesto: Inicio, Cartera, Calendario, Contactos, Prealquiler, Contratos, Finanzas, Incidencias, Tareas y mensajes, Documentos, Informes y Configuración. Finanzas contendrá Cobros, Gastos, Fianzas, Banco y Liquidaciones. Los portales externos tendrán navegación reducida según el rol.

| Código | Comportamiento de todas las pantallas |
|---|---|
| UX 01 | Mostrar empresa activa, perfil y alcance de cartera en la cabecera |
| UX 02 | Listados con búsqueda, filtros, orden, paginación y contador de resultados |
| UX 03 | Ficha con resumen, relaciones, documentos e historial pertinentes |
| UX 04 | Estados vacíos con siguiente acción; errores con explicación y posibilidad de reintento |
| UX 05 | Confirmar acciones con efectos económicos, publicación a portales o eliminación |
| UX 06 | Prevenir doble envío al guardar; avisar si otro usuario modificó el registro |
| UX 07 | Formularios con etiquetas, campos obligatorios, validación y guardado de borrador cuando proceda |
| UX 08 | Uso desde ordenador y móvil; tablas con alternativa legible sin desplazamiento horizontal excesivo |
| UX 09 | Navegación por teclado, foco visible y contraste comprobado; estados comprensibles sin depender del color |
| UX 10 | Enlaces desde cada total a su desglose; filtros y periodo visibles en informes |
| UX 11 | Diseño minimalista con jerarquía visual clara, espacios suficientes y una acción principal por vista |
| UX 12 | Sistema de colores coherente para acciones, superficies y estados, con texto e iconos que expliquen su significado |
| UX 13 | Formularios progresivos: mostrar primero los campos esenciales y agrupar las opciones avanzadas |
| UX 14 | Comparador de planes y prueba con condiciones, fecha de fin y precio posterior claramente visibles antes de confirmar |

No colocar mensajes sobre herramientas de desarrollo en la experiencia del cliente. Una persona debe entender qué se guardó y qué queda pendiente, sin conocer Supabase o GitHub.

Aceptación UX: un gestor incorpora una vivienda, crea un contrato y registra un pago parcial sin ayuda técnica. Desde móvil, un inquilino puede abrir su saldo y crear una incidencia con una foto. Probar carga lenta, sesión caducada y error de guardado sin pérdida silenciosa de datos.

### Dirección visual propuesta

Interfaz luminosa con fondo neutro, superficies blancas, texto oscuro y un verde azulado para las acciones principales. El color ayuda a orientarse; las pantallas financieras priorizan lectura y comparación. Evitar degradados intensos, sombras decorativas, exceso de tarjetas y gráficos sin utilidad. El diseño concreto se validará mediante pantallas de Inicio, Contrato, Cobros y Planes antes de extenderlo.

| Uso | Color propuesto | Aplicación |
|---|---|---|
| Fondo general | #F7F9FC | Fondo de navegación y áreas de trabajo |
| Superficies | #FFFFFF | Formularios, listados y paneles |
| Texto principal | #172B4D | Títulos, datos y navegación |
| Texto secundario | #52637A | Ayudas, fechas y metadatos |
| Acción principal | #0F766E | Botón principal, enlaces y selección; texto blanco |
| Acento suave | #E6F4F1 | Selección y avisos informativos con texto oscuro |
| Bordes | #D8E1EA | Separación discreta entre superficies |
| Éxito | #166534 | Confirmaciones con icono y texto |
| Advertencia | #92400E | Atención requerida sobre fondo claro |
| Error | #B91C1C | Error o acción destructiva con explicación |

Tipografía sans serif legible, tamaños consistentes y cifras alineadas en tablas. Probar legibilidad y contraste de cada combinación real, foco, hover, selección y estado desactivado. Proponer modo claro en V1; modo oscuro queda pendiente. Las fichas comerciales comparten diseño y destacan Pro como recomendación revisable, sin inducir selección por defecto ni ocultar diferencias. No se ha aprobado una identidad de marca definitiva.

## 5 Alta de cartera e importaciones

El recorrido de incorporación pide primero modalidad de negocio y carteras, después propiedades y unidades, contactos, contratos y saldos iniciales. Se permite empezar manualmente con pocos registros o importar mediante CSV. La demostración utiliza datos ficticios separados de la producción.

| Código | Requisito V1 |
|---|---|
| IMP 01 | Plantillas CSV documentadas para contactos, inmuebles, unidades, contratos y obligaciones iniciales |
| IMP 02 | Mapeo de columnas, formato de fecha, separador y decimales con vista previa |
| IMP 03 | Validación de campos, referencias, duplicados y coherencia de fechas antes de confirmar |
| IMP 04 | Errores por fila descargables; no importar silenciosamente filas inválidas |
| IMP 05 | Seleccionar empresa, cartera y fecha de corte antes de importar; conservar fuente y autor |
| IMP 06 | Propuesta de límite inicial de 5.000 filas por lote y 10 MB por archivo, a comprobar técnicamente |
| IMP 07 | Reimportar el mismo lote no duplica registros; actualizaciones solo con identificador estable y confirmación |
| IMP 08 | Resumen de creados, omitidos y rechazados, con historial del lote y estado final |
| IMP 09 | Saldos iniciales con fecha de corte, origen y conciliación; impedir sumarlos de nuevo al histórico completo |

Primera versión con CSV UTF-8. La importación directa de XLSX, OCR y migraciones automáticas desde otros programas quedan aplazadas. El usuario puede convertir una hoja a CSV con ayuda, conservando el original.

Reversión: un lote que no ha sido utilizado puede anularse íntegramente con revisión. Si ya hay pagos, contratos activados u otras dependencias, bloquear el borrado automático y preparar correcciones trazables. No prometer deshacer importaciones con efectos posteriores mediante un solo botón.

Aceptación IMP: importar datos de dos viviendas y doce habitaciones con dos contactos duplicados y un contrato que referencia una unidad inexistente. La vista previa identifica cada problema; el segundo intento del lote aceptado no crea duplicados. Comparar totales financieros antes y después.

## 6 Inmuebles unidades y disponibilidad

Cada inmueble puede contener una o varias unidades alquilables. Una vivienda completa puede representarse como una unidad o dividirse en habitaciones. La activación de contratos debe respetar esa relación para evitar vender dos veces el mismo espacio.

| Código | Requisito V1 |
|---|---|
| CAR 01 | Alta de inmueble con código, dirección, tipo, cartera, sociedad descriptiva y responsables |
| CAR 02 | Unidades con código único en empresa, tipo, capacidad descriptiva, superficie opcional y renta orientativa |
| CAR 03 | Propietarios vinculados con fechas y porcentajes cuando corresponda; sin confundirlos con titulares de cuentas técnicas |
| CAR 04 | Estados disponible, reservada, ocupada, bloqueada por mantenimiento e inactiva, derivados de intervalos |
| CAR 05 | Documentos, fotos, suministros y notas internas asociados al inmueble o unidad |
| CAR 06 | Calendario por vivienda y unidad con contratos, reservas y bloqueos; filtros por cartera y fechas |
| CAR 07 | Detectar conflictos de ocupación al reservar o activar contrato, también entre vivienda completa y habitaciones |
| CAR 08 | Archivar sin borrar historial; no archivar una unidad con contrato activo sin resolver su situación |
| CAR 09 | Registrar costes recurrentes al propietario para rent-to-rent y relaciones de gestión para agencia |

Campos económicos se guardan en el contrato o regla correspondiente, no solo en la ficha del inmueble. Cambiar una renta orientativa no modifica contratos activos. La ocupación mostrará la fecha a la que se refiere; una unidad puede estar ocupada hoy y disponible en otra fecha.

Aceptación CAR: activar una vivienda completa y comprobar que no puede reservarse una de sus habitaciones en el mismo intervalo. Permitir un contrato que comience al terminar otro según la regla de fechas de la sección 18. Archivar y comprobar que el historial financiero sigue siendo accesible.

## 7 Contactos candidatos y prealquiler

Una persona o empresa puede tener varias funciones dentro de la misma empresa cliente: propietario, inquilino, avalista, candidato o proveedor. No se compartirán contactos automáticamente entre empresas distintas aunque coincida el correo.

| Código | Requisito V1 |
|---|---|
| CT 01 | Ficha de contacto con tipo persona o empresa, nombre, correo, teléfono, dirección opcional y roles |
| CT 02 | Documentos identificativos solo si están justificados; visibilidad restringida y conservación definida |
| CT 03 | Detección de posibles duplicados; fusión revisada sin perder contratos ni historial |
| CT 04 | Preferencias de contacto y registro de autorización o base aplicable cuando sea necesaria |
| PRE 01 | Candidato con origen, fecha, unidad o preferencias, responsable y próximas acciones |
| PRE 02 | Solicitud con estados nueva, en revisión, pendiente de información, aceptada, rechazada y retirada |
| PRE 03 | Reserva interna con unidad, fechas, caducidad y estado; sin cobro de señal en V1 |
| PRE 04 | Conversión a contrato borrador conservando el vínculo y evitando duplicar contacto |
| PRE 05 | Cancelar o caducar reserva libera disponibilidad; motivos registrados y conflictos comprobados |
| PRE 06 | Lista y calendario de disponibilidad consultables por gestores; sin portal público de reservas |

No habrá scoring automático ni rechazo basado en IA. Las notas internas de valoración no son visibles en el portal del candidato o del inquilino. No almacenar datos personales de posibles inquilinos sin finalidad y plazo definidos.

Aceptación PRE: dos gestores intentan reservar la misma habitación a la vez; solo una reserva incompatible puede confirmarse. Al caducar, vuelve a estar disponible. Convertir una solicitud aceptada a contrato una segunda vez debe abrir el borrador existente o impedir el duplicado.

## 8 Contratos y ciclo de ocupación

El contrato reúne unidad o unidades autorizadas, partes, modalidad, fechas, renta, periodicidad mensual, fecha de vencimiento, fianza, conceptos recurrentes y documentos. Las plantillas jurídicas y la verificación del régimen aplicable no se automatizan en V1.

| Código | Requisito V1 |
|---|---|
| CON 01 | Crear borrador con partes, objeto, fechas, renta y condiciones económicas; validar antes de activar |
| CON 02 | Adjuntar contrato firmado fuera del sistema y anotar fecha y estado de firma externa |
| CON 03 | Estados borrador, pendiente de formalización, activo, finalizado y cancelado, con historial |
| CON 04 | Cambio de habitación mediante fin del tramo anterior y nuevo tramo sin solapes ni pérdida del historial |
| CON 05 | Renovación o prórroga con nuevas fechas y documento; mostrar obligaciones futuras afectadas |
| CON 06 | Cambio de renta o gasto recurrente con fecha efectiva y vista previa, conservando periodos anteriores |
| CON 07 | Prorrateo de primera y última mensualidad según regla explícita de la sección 18 |
| CON 08 | Salida anticipada con fecha y motivo; cancelar futuras obligaciones según decisión confirmada |
| CON 09 | Avisos de vencimiento y revisión contractual; una alerta no modifica renta automáticamente |
| CON 10 | Resumen descargable de datos y documentos, sin presentar el resumen como contrato jurídico válido |

Activar exige resolver conflictos de ocupación y registrar la confirmación del gestor. Los campos financieros esenciales no podrán sobrescribirse después de generar movimientos: se modifica una regla con fecha efectiva o se crea ajuste. Un contrato con cobros no se elimina físicamente mediante una acción ordinaria.

Flujo: solicitud aceptada → borrador → revisión → documento formalizado fuera del sistema → activación → obligaciones mensuales → cambios o prórroga → salida → cierre de saldos y fianza. La aplicación debe mostrar tareas pendientes durante la salida.

Aceptación CON: renta de 600 € con entrada el 16 de abril y ocupación hasta el 30 incluido produce 300 € con días naturales. Cambiar renta desde junio no altera abril o mayo. Una renovación no regenera la deuda ya existente.

## 9 Obligaciones cobros y fianzas

Una obligación es un importe que corresponde cobrar, con periodo y vencimiento. Un cobro es el dinero recibido. Una asignación indica qué obligación cancela ese cobro. Un movimiento bancario evidencia la entrada en cuenta; no crea un segundo cobro si ya se registró manualmente.

| Código | Requisito V1 |
|---|---|
| FIN 01 | Generación mensual de obligaciones desde contratos y reglas, con vista previa e identificador único por concepto y periodo |
| FIN 02 | Conceptos separados para renta, gastos repercutidos, ajustes y otros cargos autorizados |
| FIN 03 | Registrar cobro manual con fecha, importe, medio, cuenta, referencia y justificante |
| FIN 04 | Asignar total o parcialmente a una o varias obligaciones con confirmación explícita |
| FIN 05 | Exceso de cobro como saldo sin asignar del pagador; nunca renta adicional automática |
| FIN 06 | Estados pendiente, parcial, satisfecho, anulado; vencido como condición por fecha y saldo |
| FIN 07 | Devolución o anulación mediante contramovimiento y motivo, conservando el original |
| FIN 08 | Justificante de pago descargable, identificado como justificante y sin prometer factura fiscal |
| FIN 09 | Cuenta de cada inquilino con obligaciones, cobros, saldo sin asignar y trazabilidad |
| FIA 01 | Fianza con importe previsto, recibido, retenido, compensado y devuelto; separada de ingresos de renta |
| FIA 02 | Devolución o compensación de fianza con concepto, evidencia y aprobación; sin automatizar depósito ante organismo |
| FIA 03 | Avisar de fianza pendiente al activar y de devolución pendiente al cerrar contrato |

Operaciones monetarias en servidor, con importes decimales y transacciones. Los reintentos de generación no duplican mensualidades. No se permite que dos asignaciones simultáneas utilicen el mismo saldo disponible. Separar la fecha del dinero, el periodo económico y la fecha de vencimiento.

Ejemplos: 400 € contra una obligación de 600 dejan 200 pendientes. Un pago de 900 puede cubrir obligaciones de 600 y 300. Si se reciben 650 para una deuda de 600, quedan 50 sin asignar. Una devolución de 100 reabre 100 de deuda según la asignación revertida.

Aceptación FIN: ejecutar esos ejemplos, repetir peticiones y abrir dos sesiones simultáneas. Las sumas de asignaciones no exceden lo recibido ni el saldo de obligación. Una fianza de 600 no incrementa el ingreso de alquiler ni el margen operativo mostrado.

## 10 Gastos y reparto entre unidades

Los gastos deben distinguir importe previsto, obligación de pago y salida de dinero. El documento del proveedor se adjunta como evidencia; no se genera contabilidad fiscal por el simple registro del gasto.

| Código | Requisito V1 |
|---|---|
| GAS 01 | Registrar proveedor, categoría, inmueble o unidad, periodo, fecha, vencimiento, total y documento |
| GAS 02 | Gastos recurrentes con fechas de vigencia y generación sin duplicados |
| GAS 03 | Marcar quién soporta el coste: operador, propietario o inquilino, con regla explícita |
| GAS 04 | Reparto por partes iguales entre unidades seleccionadas o por importes manuales; conservar total y regla |
| GAS 05 | Vista previa del reparto y creación controlada de obligaciones repercutidas |
| GAS 06 | Registrar pagos parciales o totales a proveedor y conciliarlos con salidas de banco |
| GAS 07 | Evitar repercutir dos veces el mismo gasto; correcciones mediante ajuste trazable |
| GAS 08 | Vincular gasto a incidencia y presupuesto aprobado, manteniendo el mismo registro financiero |

Los impuestos se podrán registrar como datos del documento externo si resultan necesarios, con total controlado, sin calcular declaraciones ni decidir deducibilidad. La aplicación no determinará automáticamente qué gastos se pueden repercutir: el gestor debe comprobar la condición contractual.

Aceptación GAS: 120 € entre cuatro habitaciones produce 30 por habitación. Repartir 100 € entre tres produce 33,34 + 33,33 + 33,33 conforme a una regla estable y visible. Un segundo clic no genera tres cargos nuevos. Si el gasto se paga en dos veces, el saldo de proveedor disminuye con cada pago sin alterar el coste original.

Repartos por consumo, lectura de contadores, ocupación diaria y coeficientes contractuales complejos quedan aplazados. Se podrán resolver mediante importes manuales revisados mientras no se incorporen reglas nuevas.

## 11 Banco y conciliación

V1 utiliza extractos CSV. No solicita credenciales de banca ni inicia transferencias. La conciliación relaciona movimientos con cobros y pagos del sistema y permite corregir asociaciones sin perder evidencia.

| Código | Requisito V1 |
|---|---|
| BAN 01 | Cuenta bancaria con nombre y titular descriptivos, empresa, moneda EUR e IBAN protegido si se registra |
| BAN 02 | Importar fecha, concepto, referencia e importe con signo mediante mapeo y previsualización |
| BAN 03 | Detectar lotes y movimientos repetidos; coincidencias dudosas requieren decisión y no se eliminan automáticamente |
| BAN 04 | Estados pendiente, parcialmente conciliado, conciliado y descartado, con recuperación del descartado |
| BAN 05 | Vincular a cobros o pagos existentes o crear uno nuevo mediante acción explícita |
| BAN 06 | Conciliación de uno a varios y varios a uno con control del importe restante en ambos lados |
| BAN 07 | Sugerencias por importe, referencia y proximidad temporal; usuario confirma antes de contabilizar |
| BAN 08 | Desconciliar deja clara la decisión sobre el cobro o pago asociado; no lo borra silenciosamente |
| BAN 09 | Registrar autor, fecha, entidades vinculadas y motivo de corrección |

La huella de duplicados combinará cuenta y referencia de origen si existe; si no, fecha, importe y concepto normalizado con revisión de coincidencias. Dos movimientos reales con el mismo importe y fecha no pueden descartarse únicamente por parecer iguales.

Aceptación BAN: importar un cobro ya registrado manualmente y asociarlo sin incrementar caja dos veces. Conciliar una entrada de 900 con dos cobros de 600 y 300. Importar el mismo archivo otra vez y verificar ausencia de duplicados; conservar dos movimientos iguales cuando sus referencias son distintas. Un extracto con entradas y salidas debe mantener la suma del original.

## 12 Propietarios liquidaciones y cierre

El modelo propio, el de agencia y el de rent-to-rent generan obligaciones diferentes. V1 permite explicar esos flujos con reglas limitadas. No mezclará rentabilidad del propietario, margen del operador y caja del gestor.

| Código | Requisito V1 |
|---|---|
| LIQ 01 | Configurar relación con propietario: patrimonio propio, mandato de gestión o renta fija rent-to-rent |
| LIQ 02 | En agencia, honorario fijo o porcentaje sobre cobros de renta asignados del periodo, excluyendo fianzas |
| LIQ 03 | Gastos a cargo de propietario aprobados y ajustes manuales identificados |
| LIQ 04 | Generar borrador por propietario y mes con desglose, saldo anterior y regla utilizada |
| LIQ 05 | Estados borrador, revisado, aprobado, enviado y pagado o parcial; correcciones con nueva versión |
| LIQ 06 | Aprobar bloquea el resumen; una corrección conserva la versión anterior y recalcula diferencias |
| LIQ 07 | Descargar y compartir resumen aprobado; registrar el pago realizado externamente y conciliarlo |
| LIQ 08 | Rent-to-rent crea obligación fija al dueño; su margen se informa aparte, no como dinero del dueño |
| LIQ 09 | Cierre mensual con comprobaciones de pendientes, conciliación y ajustes; reapertura solo por administrador con motivo |

Supuestos propuestos: honorario en agencia calculado sobre cobros de renta asignados con fecha de recepción dentro del mes; porcentajes aplicados a una base visible; copropiedad por porcentajes que sumen cien; redondeo de la sección 18. Fiscalidad de honorarios y retenciones gestionada en sistema externo y referenciada cuando corresponda. Validar estas reglas con el socio antes de implementarlas.

Aceptación LIQ: cobrar 1.000 €, aplicar honorario del 10 por ciento y un gasto de propietario de 50 produce un saldo operativo de 850 antes de ajustes fiscales externos y saldos anteriores. En rent-to-rent, 2.400 de renta, 1.500 al dueño y gastos de 200 y 100 producen un margen operativo simplificado de 600, identificando la base y excluyendo otros costes. Pagos pendientes no se muestran como pagos ejecutados.

No se incluyen liquidaciones con cascadas de rentabilidad, garantías complejas, porcentajes sobre devengo, pagos automáticos o distribución de fondos mediante una pasarela propia. Un cambio de base de honorarios requiere modificar y probar este bloque.

## 13 Incidencias proveedores y tareas

Una incidencia puede originarse en el gestor o en el portal del inquilino y terminar en un gasto. Las conversaciones visibles al cliente se separan de las notas internas.

| Código | Requisito V1 |
|---|---|
| INC 01 | Alta con inmueble o unidad, categoría, descripción, prioridad, contacto, fotos y fecha |
| INC 02 | Estados nueva, en revisión, asignada, pendiente de aprobación, en curso, resuelta y cerrada |
| INC 03 | Responsable interno, proveedor opcional, fecha objetivo y seguimiento de retrasos |
| INC 04 | Presupuesto con importe, documento, versión y aceptación o rechazo por administrador autorizado |
| INC 05 | Visita o tarea con fecha y resultado; sin gestión de rutas ni agenda externa sincronizada |
| INC 06 | Mensajes con visibilidad explícita e historial; notificación a participantes pertinentes |
| INC 07 | Cierre con resultado, evidencia y coste; reapertura con motivo |
| INC 08 | Generar gasto desde presupuesto aprobado sin crear duplicados ni confundir presupuesto con pago |
| TAR 01 | Tareas independientes o relacionadas con expediente, responsable, fecha y estado |
| TAR 02 | Panel personal de pendientes y enlace al registro que origina la tarea |

Propuesta de archivo: fotos JPG/PNG y PDF, límite inicial de 20 MB por documento; validación de tipo y tamaño también en servidor. Vídeo y otros tipos se evaluarán después. Una incidencia urgente mostrará instrucciones de contacto acordadas; la aplicación no se presenta como servicio de emergencias.

Aceptación INC: inquilino crea una fuga con foto; gestor asigna proveedor; proveedor envía presupuesto de 80 €; administrador lo aprueba; proveedor resuelve; gestor registra coste. El proveedor solo ve ese expediente; el propietario ve lo autorizado y las notas internas permanecen ocultas.

## 14 Documentos mensajes y avisos

El gestor documental vincula archivos a personas, inmuebles, contratos, gastos e incidencias. Cada archivo tiene categoría, autor, fecha, versión y nivel de acceso. Subirlo no equivale a compartirlo con todos los participantes.

| Código | Requisito V1 |
|---|---|
| DOC 01 | Almacenamiento privado por empresa con relaciones y permisos explícitos |
| DOC 02 | Acceso temporal autenticado; comprobar permiso al descargar, no confiar en la ruta del archivo |
| DOC 03 | Nueva versión conserva la anterior; documento jurídico sustituido sigue identificable |
| DOC 04 | Búsqueda por nombre, categoría y expediente; sin OCR o indexado del contenido en V1 |
| DOC 05 | Exportación con manifiesto de archivos y relaciones; estado de descarga y errores |
| DOC 06 | Validación de contenido permitido y revisión de archivos antes de distribuirlos a terceros |
| COM 01 | Conversación por contrato o incidencia y notas internas diferenciadas |
| COM 02 | Avisos internos por vencimiento, deuda, reserva, incidencia y tarea |
| COM 03 | Correo transaccional para invitación, acceso, cambios relevantes y resúmenes |
| COM 04 | Preferencias y registro de envío, fallo y reintento; no confundir entrega técnica con lectura |
| COM 05 | No adjuntar identificaciones o datos sensibles innecesarios al correo; usar enlaces seguros |

Proveedor de correo pendiente de elección. Configurar remitente, dominio, autenticación y límites antes del piloto; los correos de acceso y los de negocio necesitan pruebas de entrega. Una caída del proveedor no debe impedir guardar una incidencia ni borrar el mensaje pendiente.

Aceptación COM: generar una alerta, reintentar su tarea y comprobar que no se envía dos veces el mismo aviso. Simular fallo del proveedor y comprobar reintento y trazabilidad. Marcar una nota como interna y verificar que no llega al portal ni al correo externo.

Aceptación DOC: intentar descargar un archivo de otra empresa, reutilizar un enlace caducado y cambiar su identificador. Probar permisos retirados, nueva versión y exportación de documentos. Revisar que documentos de identidad no aparezcan en listados destinados al proveedor.

## 15 Portales externos básicos

Los portales forman parte de V1 comercial, aunque pueden entregarse después del piloto V0. Usan la misma aplicación web y un acceso restringido; no son aplicaciones nativas independientes. Logo de empresa y nombre se mostrarán en el contexto autorizado, sin incluir dominio y diseño distintos para cada cliente.

| Código | Portal y funciones incluidas |
|---|---|
| POR 01 | Propietario: inmuebles vinculados, ocupación resumida, liquidaciones aprobadas, documentos compartidos e incidencias autorizadas |
| POR 02 | Inquilino: contrato propio, obligaciones, saldo, justificantes, documentos compartidos e incidencias propias |
| POR 03 | Proveedor: trabajos asignados, mensajes pertinentes, presupuesto y evidencia de resolución |
| POR 04 | Invitación individual con relación al contacto y permisos; revocación sin borrar el expediente |
| POR 05 | Un usuario con varias relaciones ve solo las autorizadas; selector explícito si participa en varias empresas |
| POR 06 | Confirmar la visibilidad antes de publicar documento, mensaje o liquidación |

Los portales no permiten al inquilino pagar renta con tarjeta en V1, ni al propietario ordenar una transferencia ni al proveedor emitir una factura fiscal dentro de la aplicación. Pueden mostrar referencias y adjuntar documentos externos, respetando las restricciones del rol.

Un propietario no ve automáticamente datos identificativos completos de un inquilino por tener acceso al inmueble. Deben definirse campos necesarios y finalidad. Un proveedor recibe solo datos de contacto necesarios para el trabajo asignado.

Aceptación POR: un propietario con dos viviendas no ve una tercera; un inquilino que cambió de habitación mantiene sus documentos propios y no accede al nuevo ocupante; el proveedor deja de acceder a un expediente cuando se revoca su asignación, conforme a la retención acordada. Comprobar enlaces y archivos, no solo el menú.

## 16 Panel diario e informes

Inicio debe responder qué requiere atención hoy. Las cifras financieras siempre mostrarán periodo y criterio. No se denominará beneficio contable a una diferencia operativa simplificada.

| Código | Vista V1 |
|---|---|
| INF 01 | Panel de deuda vencida, contratos próximos a terminar, reservas por caducar e incidencias retrasadas |
| INF 02 | Ocupación por unidades disponibles y ocupadas en una fecha; bloqueos separados |
| INF 03 | Previsto y devengado del periodo, cobrado por fecha de caja y deuda, identificados por separado |
| INF 04 | Antigüedad de saldos por inquilino, contrato, cartera y tramos de días |
| INF 05 | Gastos por categoría, inmueble y responsable económico; pagado frente a pendiente |
| INF 06 | Margen operativo por inmueble con ingresos y costes incluidos explícitos |
| INF 07 | Resumen por propietario y liquidaciones; vínculo al detalle y versión aprobada |
| INF 08 | Incidencias por estado, tiempo abierto, responsable y coste |
| INF 09 | Exportación CSV de informes y PDF de resúmenes seleccionados con filtros y fecha |

Ocupación propuesta para una fecha: unidades ocupadas entre unidades activas habilitadas para alquilar, mostrando también bloqueadas y excluidas. La vista por periodo utiliza días de unidad ocupada entre días de unidad habilitada; no mezclar camas y habitaciones. La fórmula y las exclusiones se mostrarán junto al informe.

Deuda: obligaciones exigibles menos asignaciones válidas y ajustes aplicables, conservando fecha de corte. Los saldos sin asignar se presentan aparte para que el gestor decida aplicarlos. Caja es dinero recibido o pagado por fecha; fianzas separadas. Margen operativo no incluye impuestos, amortizaciones o costes que no se hayan registrado.

Aceptación INF: cada total debe coincidir con su desglose y con una exportación del mismo filtro. Un cobro de una renta atrasada incrementa caja del mes de recepción sin cambiar el periodo de devengo. La fianza queda fuera de rentas. Los permisos aplican también a agregados y archivos exportados.

## 17 Venta de nuestra suscripción y soporte

Este bloque permite que un tercero pague por usar el software. Es independiente de los alquileres que ese tercero gestiona. La V1 comercial no incluye custodiar dinero de inquilinos ni repartirlo a propietarios.

| Código | Requisito V1 |
|---|---|
| SaaS 01 | Alta de empresa con catálogo Basic, Pro, Max y Enterprise; capacidad contratada y responsable de facturación |
| SaaS 02 | Cuota mensual por plan; precios y límites pendientes de aprobación; Enterprise sujeto a propuesta comercial |
| SaaS 03 | Integración de cobro de nuestra cuota con proveedor especializado, propuesta Stripe Billing |
| SaaS 04 | Confirmación de eventos en servidor; comprobación de firma e idempotencia |
| SaaS 05 | Estados de prueba Pro o Max durante siete días, activa, prueba terminada, impago, cancelación programada y finalizada |
| SaaS 06 | Mostrar consumo de unidades y usuarios; avisar antes de superar capacidad |
| SaaS 07 | Cambios de plan asistidos con fecha efectiva; no sobrecobrar por duplicación de eventos |
| SaaS 08 | Baja con confirmación, fecha de fin y ventana de exportación propuesta de 30 días |
| SaaS 09 | Factura de nuestra cuota por solución externa revisada y descarga o referencia accesible |
| SaaS 10 | Tabla de derechos por plan comprobada en servidor, pantallas, funciones, informes y exportaciones; no basta con ocultar botones |
| SaaS 11 | Prueba gratuita de Pro o Max con inicio y fin registrados en servidor; avisos, conversión y caducidad sin borrar datos |
| SaaS 12 | Cambiar de plan conserva datos; al bajar, revisar funciones y límites excedidos sin pérdida de historial |
| SaaS 13 | Catálogo versionado de precios y derechos; conservar lo contratado y validar que cada cobro corresponde al plan correcto |
| SOP 01 | Canal de soporte, registro de solicitud, responsable y estado; documentación de ayuda |
| SOP 02 | Pantalla de mantenimiento, registro de errores y procedimiento para comunicar incidencias del servicio |

Precios, unidades, usuarios y almacenamiento de cada plan quedan pendientes de aprobación. Las 150 unidades y cinco usuarios internos se conservan solo como escenario orientativo de piloto y no como límite común de los cuatro planes. Los usuarios externos no consumirían plaza interna según propuesta, pero su coste y límites deben definirse. Los controles de acceso, protección de datos y exportación de salida se aplican a todos los planes.

Ante impago, propuesta de aviso y gracia de siete días; después restringir nuevas operaciones y mantener consulta/exportación durante la ventana acordada, con revisión contractual. No borrar datos automáticamente al fallar una tarjeta. El plazo de conservación final debe validarse y comunicarse, sin prometer retención indefinida.

En V0 puede existir facturación manual fuera del producto y alta asistida. Para declarar V1 comercial completa se necesitan proveedor, tratamiento fiscal, condiciones y pruebas del bloque SaaS. Elegir un proveedor no acredita por sí solo cumplimiento de facturación española.

Aceptación SaaS: procesar el mismo evento dos veces; cancelar al fin del periodo; simular cobro fallido y recuperación; cambiar límite sin pérdida de datos; validar que solo el administrador accede a facturación. Ningún evento puede activar una empresa distinta por aceptar un identificador enviado por el navegador.

### Reparto inicial de funciones por plan

Los nombres y la existencia de los cuatro planes están confirmados. Esta distribución es una propuesta comercial para revisar y validar con clientes. Todos los módulos siguientes pertenecen al alcance global de V1; su disponibilidad depende de los derechos contratados.

| Área | Basic | Pro | Max | Enterprise |
|---|---|---|---|---|
| Cartera contactos contratos y dinero manual | Incluido | Incluido | Incluido | Incluido |
| Incidencias y documentos básicos | Incluido | Incluido | Incluido | Incluido |
| Importación de alta y exportación de salida | Incluido | Incluido | Incluido | Incluido |
| Calendario y prealquiler interno | Consulta básica | Completo V1 | Completo V1 | Completo V1 |
| CSV bancario y conciliación | Sin módulo | Incluido | Incluido | Incluido |
| Portal de inquilino y propietario | Sin portal | Básicos V1 | Básicos V1 | Básicos V1 |
| Repartos y liquidaciones a propietarios | Sin automatización | Reglas simples V1 | Reglas simples V1 | Reglas simples V1 |
| Portal de proveedor y presupuesto | Gestión interna | Gestión interna | Portal V1 | Portal V1 |
| Informes | Básicos | Financieros V1 | Todos los informes V1 | Todos los informes V1 |
| Capacidad y acompañamiento | Por definir | Por definir | Mayor capacidad por definir | Capacidad e incorporación acordadas |
| Prueba gratuita | Sin prueba de este plan | Siete días | Siete días | Consulta comercial |

Enterprise no promete funciones aplazadas de la sección 21. No incluye automáticamente SSO, API pública, banca conectada, app nativa o desarrollo ilimitado. Cualquier necesidad fuera de V1 requiere acuerdo y estimación. Su diferenciación inicial sería capacidad, incorporación y servicio acordado. La distribución exacta de informes básicos y avanzados se enumerará en el catálogo antes de vender; no basta con esas etiquetas.

### Recorrido propuesto de la prueba gratuita

El usuario elige Pro o Max, ve lo incluido y confirma las condiciones. Recomendación para revisar: sin tarjeta obligatoria, sin cobro automático al terminar y una prueba de 168 horas por empresa. Puede cambiar entre Pro y Max durante ese periodo sin reiniciar el reloj. Esta regla no concede dos pruebas consecutivas de siete días; si se desean siete días independientes para cada plan, deberá cambiarse expresamente antes de implementarla.

Registrar trial_started_at y trial_ends_at en UTC en el servidor y mostrar fecha y hora local. Iniciar la prueba cuando se active la empresa y se habiliten sus funciones, sin consumir días mientras la invitación siga pendiente. Los usuarios invitados heredan el periodo de su empresa. Propuesta: aviso a las 24 horas de finalizar y al vencimiento; sin cuenta atrás agresiva ni mensajes que simulen urgencia comercial.

Durante la prueba se aplican los derechos del plan elegido y los límites publicados para pruebas, todavía por definir. Una vez vencida sin contratación, deshabilitar nuevas operaciones de los módulos de pago y mantener consulta y exportación durante la ventana propuesta de treinta días. No convertir Basic en gratuito: el usuario debe contratar Basic si lo elige. Una contratación completada y verificada permite continuar conservando los datos; activar el pago al terminar la prueba solo si se ha consentido expresamente y la configuración lo refleja.

La elegibilidad se controla por empresa en servidor y con revisiones antiabuso proporcionadas. Cambiar correo, plan o usuario no reinicia el periodo de la misma empresa. No prometer eliminar todo abuso de identidades. Un cliente ya suscrito no obtiene otra prueba al bajar y subir de plan. Las excepciones de soporte quedan registradas.

Al bajar de Max a Pro o Basic, indicar funciones y capacidad afectadas antes de confirmar. Las incidencias de proveedores y las liquidaciones históricas permanecen consultables conforme a permisos, aunque no puedan crearse nuevas con una función no contratada. Si excede unidades o usuarios, bloquear nuevas altas y presentar opciones; no borrar registros ni escoger unilateralmente qué personas perderán acceso.

## 18 Reglas comunes de cálculo y consistencia

Estas decisiones son parte del comportamiento del producto y requieren tu validación. Modificarlas después afecta a pruebas, datos y calendario.

| Código | Regla propuesta |
|---|---|
| REG 01 | Moneda EUR, precisión de dos decimales y cálculo decimal en servidor; no aritmética monetaria binaria sin control |
| REG 02 | Redondeo comercial a céntimo por concepto; total calculado desde líneas ya redondeadas |
| REG 03 | Repartos conservan el total; asignar céntimos restantes según orden estable de identificadores y mostrarlo |
| REG 04 | Fecha de entrada incluida y fecha de salida excluida; la interfaz distingue salida del último día ocupado |
| REG 05 | Prorrateo por días naturales del mes para primera y última renta; sin regla fija de treinta días en V1 |
| REG 06 | Vencimiento en día 1 a 28 configurable para simplificar meses cortos; otros calendarios aplazados |
| REG 07 | Recurrencias con vigencia, versión y clave única; reintentar no duplica registros |
| REG 08 | Cobros y pagos separados de su asignación y conciliación; cada saldo tiene una fuente verificable |
| REG 09 | Correcciones económicas mediante ajuste o reversión; periodos cerrados requieren reapertura autorizada |
| REG 10 | No se borran operaciones económicas con dependencias mediante acciones ordinarias; se conserva motivo y actor |

Ejemplo de fechas: entrada el 16/04 y salida el 01/05 significa ocupación del 16 al 30 de abril, quince días. Con renta mensual de 600 €, son 600 × 15 / 30 = 300 €. Otro contrato puede empezar el 01/05 sin solapar. Si se introdujese salida el 30/04, el último día ocupado sería el 29; la interfaz debe explicar y confirmar esa diferencia.

Para multas, penalizaciones, revisión de renta, intereses o retenciones, V1 admite conceptos manuales documentados donde proceda, sin calcular su legalidad ni aplicarlos automáticamente. Los avisos sobre actualización de renta no ejecutan una subida ni deciden el índice permitido.

Un conflicto entre sesiones se resuelve impidiendo sobrescrituras silenciosas y solicitando recarga o revisión. Una transacción completa guarda todos los efectos o ninguno; si un correo falla después, la operación económica permanece y el aviso se reintenta por separado.

## 19 Datos y arquitectura que deberán conservarse

El producto utilizará un esquema compartido con separación estricta por empresa. Las sociedades contables descriptivas y carteras son categorías internas. El servidor comprobará relaciones para impedir que un contrato propio apunte a un contacto o unidad ajenos.

| Grupo de datos | Entidades y relaciones principales |
|---|---|
| Organización | Empresa, miembros, roles, carteras y asignaciones |
| Cartera | Inmueble, unidad, vínculo con propietario y bloqueos de disponibilidad |
| Personas | Contactos, roles, invitaciones y permisos de portal |
| Prealquiler | Candidato, solicitud, reserva y eventos de estado |
| Contratos | Contrato, partes, tramos de ocupación, reglas económicas y cambios |
| Finanzas | Obligación, ajuste, cobro/pago, asignación, fianza y gasto |
| Banco | Cuenta, lote, movimiento, coincidencia y vínculo de conciliación |
| Propietarios | Acuerdo de gestión, liquidación, líneas, aprobación y pago |
| Operación | Incidencia, presupuesto, tarea, mensaje y notificación |
| Documentación | Archivo, versión, relación, permisos y manifiesto de exportación |
| Servicio | Plan, suscripción, eventos del proveedor, soporte y auditoría |

Cada entidad tendrá identificador estable, empresa, fechas y autoría cuando corresponda. Documentar claves únicas, relaciones, índices y política de archivo. El diccionario técnico detallado se cerrará después de revisar los campos funcionales de esta guía; no crear tablas únicamente desde una pantalla sin comprobar el modelo completo.

Desarrollo y producción estarán separados en proyectos y secretos. La edición de Lovable debe apuntar a desarrollo. El despliegue productivo utilizará configuración productiva independiente y revisada. Un proyecto Supabase no equivale a una empresa cliente; en V1 varias empresas compartirán infraestructura con políticas de aislamiento, sujeto a pruebas.

GitHub guardará código, pruebas, migraciones, funciones del servidor y configuración reproducible sin claves. ChatGPT conservará especificaciones y resúmenes en archivos versionados. Los datos productivos y las copias con documentos personales quedarán fuera del repositorio de código.

La base tecnológica documenta integración propia [T2], sincronización Git [T3], seguridad por fila [T5] y archivos privados [T6]. La capacidad final dependerá del diseño, índices, consumo y pruebas. No se promete escalado automático ilimitado.

## 20 Seguridad copias y criterios de calidad

| Código | Requisito antes del uso real |
|---|---|
| SEG 01 | Políticas de aislamiento en tablas, funciones y archivos; pruebas de lectura y modificación entre clientes |
| SEG 02 | Secretos solo en servicios seguros; ninguna clave administrativa en navegador, chat o GitHub |
| SEG 03 | Permisos mínimos de integraciones; accesos de socios separados y segundo factor |
| SEG 04 | Datos ficticios en desarrollo; cualquier uso de datos reales necesita autorización y protección |
| SEG 05 | Límites y validaciones de archivos, entradas, búsquedas y exportaciones; sanitizar CSV contra fórmulas ejecutables |
| SEG 06 | Registro de acciones sensibles, acceso restringido al registro y prohibición de exponer secretos en logs |
| SEG 07 | Procedimiento de privacidad, conservación, exportación y borrado atendiendo dependencias y obligaciones |
| BAK 01 | Backup de base de datos y copia separada de Storage; archivo externo cifrado y versionado |
| BAK 02 | Restauración probada antes del piloto y después mensualmente; registrar fecha, resultado y duración |
| BAK 03 | Objetivos iniciales de perder como máximo 24 horas de datos y recuperar en una jornada; validar antes de prometerlos |
| BAK 04 | Copias de código, documentos, configuración y metadatos fuera de la única cuenta del socio |
| CAL 01 | Objetivo de carga de vistas habituales inferior a 3 segundos en el 95 por ciento de pruebas acordadas |
| CAL 02 | Prueba inicial de 150 unidades, 36 meses de obligaciones, tres empresas y diez sesiones simultáneas |
| CAL 03 | Cero defectos críticos de seguridad, cálculo o pérdida de datos al autorizar piloto o venta |
| CAL 04 | Seguimiento de errores y gasto; alerta si falla backup, generación de obligaciones o correo |

El rendimiento es un objetivo de ingeniería, no un resultado medido. Acordar red, dispositivo, consultas y datos de prueba; excluir exportaciones de gran tamaño de las vistas de tres segundos y mostrar progreso en ellas.

Supabase documenta que los backups de base de datos no contienen los objetos de Storage [T7]. Guardar además usuarios y ajustes necesarios, funciones, proveedores, URLs, tareas programadas y procedimiento de recuperación de secretos. Un ZIP del código no restaura el servicio completo.

La protección desde el diseño [L1] exige decisiones sobre finalidad, datos y accesos. Revisar contratos con proveedores, responsables y encargados, región, retención y respuesta a incidentes antes de datos reales. Las certificaciones de un proveedor no acreditan automáticamente a nuestra aplicación. La facturación fiscal propia queda fuera hasta revisión específica [L2].

## 21 Funciones aplazadas y efecto comercial

| Función fuera de V1 | Alternativa o límite visible | Qué exigiría incorporarla |
|---|---|---|
| Banca automática | CSV revisado | Proveedor bancario, consentimientos, costes y sincronización |
| Pago de rentas por tarjeta o remesa | Registrar pago externo | Pasarela, comisiones, devoluciones y modelo de cobro |
| Transferencias a propietarios | Preparar liquidación y registrar pago externo | Integración y controles de autorización |
| Firma electrónica certificada | Adjuntar documento formalizado fuera | Proveedor, evidencias y límites por proceso |
| VeriFactu y contabilidad fiscal | Referenciar facturas de sistema externo | Validación normativa e integración especializada |
| Scoring e identidad automáticos | Evaluación manual autorizada | Proveedor, base jurídica y evaluación de riesgos |
| Web pública de anuncios y reservas | Prealquiler interno | Publicación, disponibilidad pública, pagos y protección antiabuso |
| Aplicaciones nativas de marca | Web móvil | Desarrollo, tiendas, cuentas, mantenimiento y pruebas móviles |
| Dominio propio por cada cliente | Dominio único del producto y logo en portal | Enrutado, certificados y aislamiento por dominio |
| WhatsApp SMS y push | Avisos internos y correo | Proveedores, consentimiento y costes |
| Channel manager turístico | Sin operación turística integral | Conectores, inventario por noches y obligaciones específicas |
| API pública e integración contable a medida | CSV y exportación completa | Autorización, límites, documentación y soporte de versiones |
| IA para decisiones o contabilidad | Sin IA de cliente en V1 | Evaluación de utilidad, exactitud, privacidad y presupuesto |
| Uso sin conexión y multidivisa | Aplicación online en EUR | Sincronización, conflictos y reglas monetarias |

La V1 tiene brechas frente a Advanced y Enterprise. Si banca automática, firma o facturación fiscal son imprescindibles para los primeros compradores, deben convertirse en requisitos de lanzamiento y reestimarse. No ocultar esas ausencias en la venta ni prometer compatibilidad turística completa por permitir una etiqueta de modalidad.

## 22 Casos de aceptación y pruebas de extremo a extremo

Estos casos son obligatorios para evaluar la versión propuesta. Cada ejecución debe registrar versión, datos ficticios, resultado, evidencia y defecto si falla. Son pruebas pendientes, no resultados obtenidos.

| Caso | Datos y acción | Resultado esperado |
|---|---|---|
| A01 | Tres empresas; intentar acceder a contrato ajeno | Denegación en pantalla, consulta y archivo |
| A02 | Dos viviendas y doce habitaciones importadas dos veces | Doce unidades y referencias correctas, sin duplicación |
| A03 | Reservar habitación ya ocupada o vivienda completa solapada | Conflicto detectado y confirmado sin nueva ocupación |
| A04 | Entrada 16/04 y salida 01/05; renta 600 | Obligación prorrateada de 300 |
| A05 | Cobrar 400 de obligación 600 | Deuda de 200 y caja de 400 |
| A06 | Cobrar 900 y repartir 600 más 300 | Ambas obligaciones satisfechas sin duplicar caja |
| A07 | Cobrar 650 para obligación de 600 | 50 sin asignar; no ingreso de renta extra |
| A08 | Devolver 100 de un cobro asignado | Saldo reabierto e historial completo |
| A09 | Fianza recibida de 600 | Saldo de fianza separado de renta y margen |
| A10 | Gasto 100 entre tres unidades | 33,34 más 33,33 más 33,33; suma exacta |
| A11 | Reimportar banco y enlazar cobro manual | Sin duplicación de movimiento ni cobro |
| A12 | Concilia 900 con cobros 600 y 300 y deshacer | Saldos coherentes; decisión explícita sobre cobros |
| A13 | Cambiar renta desde junio y reintentar generación | Meses anteriores intactos y sin doble obligación |
| A14 | Cambio de habitación y posterior nueva ocupación | Tramos sin solape; cada inquilino ve lo suyo |
| A15 | Agencia 1.000 cobrados, 100 honorario, 50 gasto | Resumen operativo de 850 con detalle y base |
| A16 | Rent-to-rent 2.400 menos 1.500 menos 200 menos 100 | Margen simplificado 600; pagos pendientes visibles |
| A17 | Fuga con presupuesto 80 y gasto al resolver | Una incidencia, un gasto y permisos correctos |
| A18 | Portal de propietario con dos viviendas | Solo registros vinculados y versiones aprobadas |
| A19 | Revocar proveedor y caducar enlace de archivo | Nuevo acceso rechazado; sin documentos sensibles expuestos |
| A20 | Dos sesiones asignan simultáneamente un cobro | Una sola asignación válida para cada saldo disponible |
| A21 | Caída del correo y ejecución repetida | Operación guardada; aviso reintentado sin duplicación |
| A22 | Evento de suscripción repetido o manipulado | Verificación, mismo resultado y empresa correcta |
| A23 | Exportación de empresa con contratos y fotos | Datos, relaciones y archivos completos; ningún dato ajeno |
| A24 | Restaurar copia en entorno limpio | Entrar, ver contrato, saldo y documento; recuentos coinciden |
| A25 | Diez sesiones y cartera de prueba acordada | Medición de tiempos y errores contra CAL 01 y CAL 02 |
| A26 | Iniciar prueba Pro y cambiar a Max al tercer día | Mismo fin original; derechos Max hasta vencer; sin segunda prueba |
| A27 | Vencer la prueba sin contratar y luego contratar Basic | Sin cobro inesperado ni pérdida; derechos Basic solo tras confirmación del pago |
| A28 | Invocar directamente una función Max desde Basic o Pro | Denegación en servidor y sin cambios en los datos |
| A29 | Bajar de Max con datos y capacidad superior al nuevo plan | Advertencia, historial preservado y altas excedidas bloqueadas |

Revisión de usabilidad propuesta: un gestor nuevo completa alta de contrato y cobro parcial; un propietario entiende su liquidación; un inquilino informa una avería desde móvil. Registrar ayuda solicitada, errores y tiempo. Comparar con herramientas actuales usando los mismos datos antes de afirmar mejoras de productividad.

## 23 Orden de construcción y autorización de lanzamiento

| Etapa | Trabajo principal | Evidencia de salida |
|---|---|---|
| 1 | Revisar esta guía, reglas, campos y exclusiones | Versión funcional aceptada y decisiones pendientes identificadas |
| 2 | Configurar cuentas, Git y desarrollo aislado | Ambos socios acceden y recuperan documentación y código |
| 3 | Construir empresa, roles, cartera y datos ficticios | A01 a A03 y controles de archivos |
| 4 | Contratos, dinero, fianzas y gastos | A04 a A10, A13 y A20 |
| 5 | Incidencias, exportación y restauración | A17, A23 y A24; candidato V0 |
| 6 | Conciliación, liquidaciones y portales | A11, A12, A14 a A19 |
| 7 | Prealquiler completo básico, avisos e informes | Casos funcionales y comprensión de cifras |
| 8 | Suscripción propia, soporte y endurecimiento | A21, A22 y A25, revisión técnica y jurídica pertinente |
| 9 | Piloto autorizado y corrección | Lista de problemas cerrada y aceptación para comercializar |

El orden permite probar procesos antes de completar todos los módulos. La preparación comercial puede avanzar en paralelo, sin captar clientes con funciones no disponibles ni contactar personas sin autorización.

Estimación propia para la V1 completa: 10 a 18 semanas naturales, sujeta a disponibilidad, revisiones y proveedores. El piloto V0 es menor y puede validarse antes. Reestimar al finalizar la prueba técnica. Para el 12/11/2026 proponemos revisar un prototipo acotado; no prometer esta guía completa en 24 días.

Condiciones para venta: requisitos V1 aceptados o exclusiones comunicadas y aprobadas; pruebas de dinero y permisos superadas; copia restaurada; responsables de soporte y mantenimiento designados; cobro y facturación de nuestra cuota resueltos; condiciones, privacidad y retención revisadas; costes y capacidad medidos. Los cambios productivos se publican por versión, con plan de recuperación también para datos.

## 24 Decisiones y registro de cambios

| Decisión | Propuesta que puedes modificar | Efecto principal |
|---|---|---|
| D01 Segmento comercial | Mantener tres modelos y validar prioridad | Mensaje, ventas y necesidades |
| D02 Portales | Tres portales básicos en V1 | Plazo y superficie de permisos |
| D03 Banca | CSV, sin conexión automática | Fricción frente a Advanced |
| D04 Firma y facturación | Documentos y facturas externas | Dependencia del proceso actual |
| D05 Finanzas | Prorrateo natural y honorario sobre cobrado | Cálculos y pruebas |
| D06 Copropiedad | Porcentajes y reparto simple | Liquidaciones y redondeo |
| D07 Oferta | Basic Pro Max Enterprise confirmados; reparto, precios y capacidades propuestos | Derechos, coste y comercialización |
| D08 Operación | Correo transaccional y proveedor de cuota externos | Contratación y coste |
| D09 Tecnología | Supabase propio, web Lovable y GitHub | Acceso, despliegue y mantenimiento |
| D10 Continuidad | Ambos con acceso acordado y copias independientes | Recuperación del producto |
| D11 Plazo | Reestimar tras prototipo; 10 a 18 semanas orientativas | Presupuesto y fecha de salida |
| D12 Turismo | Investigación mantenida; sin PMS turístico V1 | Mercado atendible al lanzar |
| D13 Pruebas | Siete días Pro y Max confirmados; una ventana por empresa y sin tarjeta como propuesta | Conversión y control de acceso |
| D14 Diseño | Minimalista fácil y atractivo confirmado; paleta verde azulada y neutra propuesta | Interfaz y marca |

Registro de revisión para completar: fecha, código, añadir/cambiar/quitar, descripción, motivo, prioridad, decisión y responsable. Identificar cualquier requisito indispensable para que el socio opere o para que un tercero compre: esos requisitos deben entrar antes de acordar fecha.

Cuando se acepte el alcance, convertir cada requisito en una tarea vinculada en GitHub con su prueba. Mantener por separado el estado documental aprobado, el estado construido y el estado probado. Una tarea solo se considera terminada cuando cumple su aceptación y no introduce fallos en procesos relacionados.

## 25 Referencias de capacidad y cumplimiento

Consulta web: 19 de octubre de 2026. Las referencias respaldan capacidades de herramientas; el contenido funcional es nuestra especificación propuesta, no una función ya suministrada por contratar esas herramientas.

- H0. Propuesta Homming 2026 75-150.pdf, páginas 6, 13 y 14; archivo facilitado por el usuario.
- T1. Work para planificación y archivos: https://learn.chatgpt.com/docs/get-started-with-work
- T2. Backend propio: https://docs.lovable.dev/integrations/supabase
- T3. Código y sincronización: https://docs.lovable.dev/integrations/github
- T4. Publicación web: https://docs.lovable.dev/features/hosting
- T5. Aislamiento por políticas: https://supabase.com/docs/guides/database/postgres/row-level-security
- T6. Archivos privados: https://supabase.com/docs/guides/storage/security/access-control
- T7. Cobertura de backups: https://supabase.com/docs/guides/platform/backups
- T8. Controles GitHub por plan: https://docs.github.com/en/get-started/learning-about-github/githubs-plans
- T9. Automatismos programados: https://supabase.com/docs/guides/functions/schedule-functions
- T10. Aplicaciones web móviles: https://lovable.dev/build/mobile-app-builder
- T11. SMTP de autenticación: https://supabase.com/docs/guides/auth/auth-smtp
- T12. Gestión de eventos de suscripción: https://docs.stripe.com/billing/subscriptions/webhooks
- L1. Protección desde el diseño: https://www.aepd.es/derechos-y-deberes/cumple-tus-deberes/medidas-de-cumplimiento/proteccion-de-datos-desde-el-diseno
- L2. Facturación y VERI*FACTU: https://www3.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu.html
