# Blueprint para construir y lanzar la primera versión

> Actualización de decisiones — 21/10/2026: el usuario aprobó E, C y T como base inicial en [tabla-cierre-g0-2026-10-21.md](tabla-cierre-g0-2026-10-21.md), v1.1. Esa aprobación sustituye las menciones históricas de pendiente para las reglas económicas, catálogo y mecánica de prueba cubiertos por E1–E9, C1–C7 y T1–T6. O sigue pendiente y G0 abierto. No autoriza construcción ni acciones externas. El inventario general de identidades/cuentas se omite por instrucción del 21/10. El texto original que sigue y las copias Word conservan su contexto del 19/10.

REAL ESTATE SOFTWARE | Guía de ejecución para los socios | Versión 1.0 | 19 de octubre de 2026

Este documento convierte la especificación V1.1 en un proceso de construcción con ChatGPT Pro y Work, Lovable, Supabase y GitHub. Explica qué preparar, qué encargar a la IA, qué resultado conservar y cómo comprobar cada fase antes de continuar. Está pensado para que los socios dirijan el proyecto sin escribir código; el código y las configuraciones los generará la IA y una persona con responsabilidad técnica revisará las partes críticas.

La aprobación recibida autoriza preparar este blueprint. No equivale a comprar suscripciones, crear cuentas, cambiar accesos, desarrollar el producto, tratar datos de inquilinos o publicarlo. Los cuatro planes Basic, Pro, Max y Enterprise, las pruebas de siete días para Pro y Max, el diseño minimalista y la empresa con un único administrador sí son requisitos expresados por el usuario. La distribución comercial, los precios, las capacidades y la mecánica concreta de la prueba siguen pendientes.

La meta de calidad es una versión cuyo comportamiento esté probado y cuyos riesgos conocidos estén controlados. No es posible prometer software sin errores. La salida al mercado se bloqueará ante fallos de aislamiento entre empresas, saldos incorrectos, cobros duplicados, restauración fallida o incumplimientos esenciales sin resolver.

**Documentos de referencia:** especificacion-primera-version-2026-10-19.md, versión 1.1, con 175 requisitos y 29 casos A01 a A29; analisis-competitivo-homming-2026-10-19.md; plan-creacion-cuentas-y-copias-2026-10-17.md. Este blueprint añade el recorrido de empresa unipersonal y pruebas operativas complementarias. No modifica silenciosamente el resto de la especificación. El Markdown de este documento será la fuente autoritativa y el Word, la copia editable de revisión.

## 1 Cómo utilizar la guía y decidir el avance

Leer primero las secciones 2 a 7 con el socio. Después ejecutar las fases en orden. Cada paso tiene una salida verificable; no basta con que Lovable muestre una pantalla atractiva o indique que ha terminado. Guardar evidencias y decidir el avance por resultados.

Los pasos están identificados de P01 a P64. Cada bloque señala responsables, herramientas, acciones, entrega y condición de avance. La persona técnica puede ser colaboradora externa; no necesita ser uno de los socios. Su disponibilidad y coste deben acordarse antes de poner datos reales en el sistema.

| Punto de control | Resultado necesario | Quién decide |
|---|---|---|
| G0 Definición | Alcance, reglas económicas, planes y presupuesto documentados | Ambos socios |
| G1 Viabilidad | Cadena Lovable a GitHub a aplicación aislada demostrada | Responsable técnico y socios |
| G2 Base segura | Empresa, permisos, archivos y administrador único probados | Responsable técnico |
| G3 Núcleo fiable | Contratos, dinero, exportación y restauración correctos | Técnico y usuario operativo |
| G4 V1 completa | Módulos y suscripción superan pruebas de aceptación | Técnico y socios |
| G5 Piloto | Uso real autorizado y cierre operativo contrastado | Socios y participantes |
| G6 Lanzamiento | Revisión de seguridad, legal, soporte y recuperación completa | Socios con evidencias técnicas |

Si falla un punto, corregir, repetir las pruebas afectadas y documentar el resultado. Una excepción solo puede admitir un defecto menor sin impacto material, con solución provisional, responsable y fecha. No se aceptan excepciones para exposición de datos, corrupción de dinero o cobros sin autorización.

## 2 Alcance de producto y decisiones pendientes

Construir un servicio web adaptable a ordenador y móvil, inicialmente en español y EUR. Debe distinguir patrimonio propio, agencia y rent-to-rent; viviendas completas y habitaciones sin solapes. Los contratos de temporada se registran sin afirmar que el sistema determine su validez jurídica. No venderlo como PMS turístico completo.

La V0 es una entrega interna de validación: acceso, cartera, contactos, contratos, dinero manual, incidencias y exportación/restauración. La V1 comercial incorpora además prealquiler, banco por CSV, liquidaciones simples, portales básicos, informes, avisos y la venta de nuestra suscripción. Reducir el piloto no elimina esos módulos de la V1 propuesta.

Quedan fuera del compromiso inicial banca conectada, cobro y reparto de alquileres, SEPA, firma electrónica integrada, contabilidad fiscal, VERI*FACTU propio, channel manager, app nativa, WhatsApp, API pública y funciones de IA para clientes. No anunciarlas como incluidas en Enterprise.

| Decisión que debe quedar escrita en G0 | Propuesta de trabajo | Consecuencia si no se resuelve |
|---|---|---|
| Cliente inicial y uso piloto | Validar los tres modelos y elegir un recorrido prioritario | Diseño demasiado amplio y poco validado |
| Precio y capacidades | Cuota mensual y límites publicados por plan | No se puede abrir contratación |
| Prueba Pro y Max | Una ventana de 168 horas por empresa, sin tarjeta, cambio sin reinicio | No implementar como si estuviera aprobado |
| Retención e impago | Gracia y consulta/exportación con plazo contractual definido | Bloqueo de baja y conservación |
| Reglas financieras | Adoptar o corregir REG 01 a REG 10 | No construir el motor definitivo |
| Responsables y presupuesto | Un socio de producto, otro de negocio y técnico identificado | No iniciar producción |
| Alojamiento | Probar ruta segura y presupuesto antes de elegir | No comprometer despliegue comercial |

## 3 Herramientas y suscripciones por etapa

Las capacidades documentadas se consultaron en fuentes oficiales el 19 de octubre de 2026. Los importes del plan de cuentas anterior son un escenario, no un presupuesto aprobado. Confirmar precio, impuestos, límites y modalidad de pago en la contratación. No comprar el plan más alto para compensar una arquitectura sin validar.

| Servicio | Elección inicial propuesta | Cuándo ampliar o revisar |
|---|---|---|
| ChatGPT | Pro individual para quien construya y documente | Si ambos trabajan, identidades y acceso propios; no compartir contraseña |
| ChatGPT Work | Usar el espacio y capacidades disponibles en la cuenta | Comprobar acceso real, plugins y exportación; no tratar Work como otra licencia confirmada |
| Lovable | Pro para construcción privada e integración con GitHub | Business si permisos y condiciones de colaboración lo requieren; validar créditos y colaboradores |
| Supabase | Desarrollo separado; producción Pro antes del piloto con datos reales | Presupuestar cómputo por proyecto, almacenamiento, tráfico y copias; no asumir dos proyectos gratis en Pro |
| GitHub | Organización privada con Team como propuesta para colaboración y protección | Verificar funciones exactas del plan, especialmente aprobaciones en entornos privados |
| Cobro de nuestra cuota | Stripe Billing propuesto, con pruebas y después modo real | Comisiones y condiciones por uso; no confundir con cobro de alquileres |
| Correo transaccional | Proveedor con SMTP propio y dominio verificado | Elegir por entrega, registros, región y coste; el correo de prueba no basta |
| Alojamiento y dominio | Lovable para prototipo; alojamiento comercial compatible por verificar | Si la publicación no permite aislamiento y control de versiones, usar host gestionado, por ejemplo Vercel Pro |
| Copias y vigilancia | Destino independiente cifrado y servicio de errores | Presupuestar almacenamiento, alertas y restauración |

La ruta de publicación propuesta en esta guía separa el editor de producción. Añadir un alojamiento externo sería un ajuste respecto a publicar todo desde Lovable, y requiere validar compatibilidad y presupuesto en G1. Vercel se estudia como ejemplo; su plan Hobby está orientado a uso personal no comercial [S15]. Si Lovable demuestra la misma separación, se puede mantener como alojamiento y documentar el procedimiento equivalente.

**Presupuesto completo:** licencias de creación + infraestructura de desarrollo y producción + correo + dominio + copias + observabilidad + comisiones de cobro + apoyo técnico + revisión legal/fiscal + impuestos. Registrar coste fijo y variable por empresa/unidad/usuario. Poner alertas y un umbral de aprobación para gasto adicional. No confundir el coste de generar pantallas con el de operar un SaaS.

## 4 Propiedad accesos y continuidad entre socios

Que el socio pague no obliga a compartir su cuenta personal. Recomendación: facturación al titular acordado, activos en espacios de la empresa cuando proceda, y cada socio con su identidad. Separar propiedad jurídica, pago y permiso técnico en un acuerdo entre socios. Un rol de administrador no acredita por sí solo copropiedad del negocio.

### P01 a P04 Preparar control y documentación

**Responsables:** ambos socios. **Herramientas:** carpetas locales, ChatGPT, espacios de cada proveedor y gestor de contraseñas.

- **P01.** Acordar nombre provisional, titular de dominio, sociedad o titular comercial, recuperación de cuentas, facultad de gasto y procedimiento de separación de socios. Registrar decisiones; no guardar contraseñas en documentos.
- **P02.** Crear un inventario previsto de activos: proyecto ChatGPT, workspace/proyecto Lovable, organización/repositorio GitHub, organización/proyectos Supabase, dominio, correo, host, Stripe, copias y monitorización. Anotar ID, titular, pagador, administradores y destino de copia.
- **P03.** Configurar, cuando se autorice, acceso individual para ambos, MFA y recuperación. Dar permisos mínimos suficientes y probar la entrada de cada uno. No transferir ni duplicar secretos por correo. Registrar qué herramientas permiten verdaderamente propiedad compartida y cuáles solo colaboración.
- **P04.** Mantener especificaciones, decisiones, prompts importantes y resultados fuera del historial del chat. Guardar en el repositorio documentos sin secretos y una copia local de cada socio; respaldo cifrado externo para datos que no deban entrar en Git.

**Entrega:** inventario de activos y guía de recuperación con ubicaciones de secretos, nunca sus valores. **Avance:** cada socio puede acceder al código y documentos autorizados sin usar la identidad del otro. La disponibilidad de toda la conversación de ChatGPT o Lovable entre cuentas debe probarse; no se promete exportación o migración íntegra. La continuidad se apoya en archivos conservados y copias verificadas.

## 5 Arquitectura y separación de entornos

La aplicación tendrá interfaz creada con Lovable, código versionado en GitHub y backend Supabase para autenticación, base de datos PostgreSQL, archivos privados y funciones de servidor. Las reglas de dinero, permisos, cuotas y suscripción se ejecutan en servidor. El navegador presenta y solicita operaciones; no decide el saldo ni los derechos de un cliente.

| Entorno | Datos y conexiones | Publicación y propósito |
|---|---|---|
| Desarrollo | Supabase dev, usuarios ficticios, Stripe test y correo de prueba | Lovable trabaja en rama de desarrollo; cambios frecuentes |
| Validación | Versión congelada, datos sintéticos y servicios de prueba | Vista previa del código candidato; nadie modifica datos durante la prueba |
| Producción | Supabase prod, Stripe real y correo/dominio reales | Solo una versión aceptada, desplegada por procedimiento controlado |

Mínimo propuesto: dos proyectos Supabase, dev y prod. La validación puede utilizar dev congelado, con limitaciones documentadas; para trabajar en paralelo sin contaminar pruebas conviene un tercer proyecto independiente, con coste adicional. Las pruebas automáticas de base de datos se ejecutan en un entorno desechable. Una rama Git no crea ni separa bases de datos [S04]. Nunca usar datos de producción como datos de prueba por comodidad.

Lovable conecta exclusivamente con desarrollo. GitHub conserva la rama main estable y ramas de trabajo; la integración activa debe verificarse porque Lovable sincroniza una rama seleccionada [S02]. No asumir que dos proyectos Lovable con el mismo backend son una solución de separación. Probar primero cómo se transfieren código y configuración sin sobrescribir credenciales [S03].

Para producción, el host recibe las variables y secretos del entorno correcto. El código exportado no incluye automáticamente filas, documentos ni toda la configuración de Supabase. El tipo de aplicación generado debe inspeccionarse: Lovable documenta aplicaciones nuevas con TanStack Start y proyectos anteriores con React/Vite; eso cambia los requisitos de alojamiento [S01]. No imponer una carpeta de salida estática sin comprobar el proyecto real.

## 6 Base documental y método de trabajo con IA

### P05 a P08 Congelar la referencia y preparar el repositorio

**Responsables:** socio de producto y responsable técnico. **Herramientas:** ChatGPT Work, archivos del proyecto y GitHub.

- **P05.** Leer V1.1, aprobar/corregir G0 y crear una versión identificada de alcance, reglas, catálogo de planes y decisiones pendientes. Incluir expresamente empresa de una sola persona con un administrador de todas las funciones propias contratadas.
- **P06.** Preparar una carpeta documental con alcance, arquitectura, modelo de datos, permisos, diseño, pruebas, despliegue, recuperación, costes y decisiones. Conservar los códigos originales de los 175 requisitos.
- **P07.** Crear el repositorio privado cuando se autorice; incluir instrucciones para la IA, archivo de ejemplo de variables sin valores reales, exclusión de secretos, migraciones y licencias de dependencias. Establecer rama de trabajo y main protegida según capacidades verificadas del plan [S11].
- **P08.** Crear una tarea por recorrido verificable: requisito, usuario, condición inicial, comportamiento, errores y prueba. Elegir dependencias en el orden de esta guía y etiquetar cada entrega con una versión.

**Entrega:** referencia aprobada y tareas trazables. **Avance:** ninguna tarea esencial depende de una regla económica pendiente. Las decisiones aún abiertas pueden mantener prototipos visuales, pero no activar contratación o reglas definitivas.

**Términos usados en la guía:** backend es la parte que guarda datos y ejecuta reglas; repositorio es el archivo versionado del código; rama es una línea de cambios; migración es un cambio reproducible de la estructura de datos; RLS son las reglas que limitan qué filas puede consultar cada usuario; MFA es un segundo factor de acceso; idempotencia significa que repetir una solicitud no duplica su efecto; webhook es un aviso enviado por otro servicio.

**Rutina por tarea:** ChatGPT redacta alcance y prueba; Lovable modifica una parte; el técnico revisa cambios y migraciones; se ejecutan pruebas; el socio valida el recorrido; se guarda una revisión de código con evidencias. Si falla, pedir corrección acotada. No encargar a la IA reconstruir toda la aplicación para resolver un error local.

## 7 Demostración técnica antes de construir módulos

### P09 a P12 Probar la cadena completa

**Responsable:** técnico con validación de los socios. **Herramientas:** Lovable, Supabase dev, GitHub y host candidato.

- **P09.** Crear un proyecto mínimo indicando integración con nuestro Supabase independiente. Confirmar si el proyecto usa Lovable Cloud u otro backend antes de continuar; no dar por hecho que se podrá cambiar después sin trabajo [S03].
- **P10.** Conectar un repositorio concreto de la organización, restringiendo permisos de la aplicación GitHub a los repositorios necesarios. Comprobar edición desde Lovable y revisión desde GitHub en la rama elegida [S02].
- **P11.** Construir solo acceso, una empresa ficticia, un registro privado y un archivo privado. Desplegar en la vista de validación y en un entorno de producción de ensayo sin clientes. Probar que cada despliegue usa su proyecto Supabase correspondiente.
- **P12.** Demostrar publicación manual de una revisión identificada y retorno a la anterior. Hacer un cambio inocuo en desarrollo y comprobar que no se publica automáticamente en el dominio comercial. Verificar qué puede desplegarse por Git o por el host y documentarlo.

**Entrega:** informe breve con IDs de entornos, versión, pruebas, coste estimado y capturas sin secretos. **Avance G1:** aislamiento demostrado, compilación repetible, acceso independiente y recuperación de versión. Si falla, resolver aquí la herramienta o el alojamiento, antes de construir cartera y dinero. No introducir datos reales para demostrar viabilidad.

## 8 Diseño de datos y reglas de seguridad

### P13 a P16 Construir el esquema base

**Responsable:** técnico; ChatGPT prepara el diseño y Lovable implementa cambios revisados. **Dependencia:** G1.

- **P13.** Diseñar entidades y relaciones de la tabla siguiente. Toda entidad de negocio pertenece a una empresa. Usar claves y relaciones que impidan enlazar un contrato de una empresa con un contacto o unidad de otra, incluso desde una función de servidor.
- **P14.** Generar migraciones versionadas para estructura, restricciones, índices y políticas. Crear pruebas con tres empresas y perfiles distintos. Ensayar cada migración en base vacía y sobre una copia sintética con datos de la versión anterior.
- **P15.** Habilitar políticas RLS para todas las tablas expuestas y políticas de archivos privados. Revisar funciones privilegiadas, permisos, ruta de búsqueda y acceso mínimo. Una clave de servicio puede saltarse RLS; su uso queda restringido al servidor y no sustituye comprobar empresa y rol [S05, S07].
- **P16.** Añadir auditoría, control de versiones para cambios concurrentes, claves de idempotencia y cola de trabajos. Separar la transacción de negocio del envío de correo; una caída del correo no deshace un cobro ya registrado.

| Grupo de entidades | Contenido esencial | Invariante principal |
|---|---|---|
| Empresas y usuarios | Empresa, miembros, roles, carteras, asignaciones e invitaciones | Toda petición comprueba membresía vigente y alcance |
| Operación | Inmuebles, unidades, contactos, candidatos y reservas | Referencias únicas por empresa y ocupación compatible |
| Contratos | Contrato, participantes, tramos y condiciones con vigencia | No alterar retroactivamente la regla aplicada |
| Dinero | Obligación, cobro/pago, asignación, ajuste, fianza y gasto | Importes exactos; corrección trazable y sin saldo doble |
| Banco y cierre | Importación, movimiento, conciliación, comisión y liquidación | Separar caja, banco y obligación; cierre versionado |
| Colaboración | Incidencia, presupuesto, tarea, mensaje y documento | Visibilidad interna o compartida explícita |
| Comercialización | Plan/versiones, derechos, suscripción y eventos del proveedor | Relación de cliente y empresa verificada en servidor |
| Operación técnica | Auditoría, trabajos, notificaciones y exportaciones | Reintentos seguros y resultados inspeccionables |

**Entrega:** diccionario de datos, diagrama de relaciones, matriz de permisos y migraciones probadas. **Avance:** ninguna tabla o archivo queda expuesto por defecto. Las pruebas de acceso se ejecutan con sesiones de usuarios reales de ensayo y peticiones anónimas, no solamente con una clave privilegiada que omitiría políticas.

## 9 Acceso y empresa con una sola persona

### P17 a P20 Resolver la entrada al producto

**Herramientas:** Lovable y Supabase Auth. **Requisitos:** ACC 01 a ACC 09 y parte de UX.

- **P17.** Implementar alta autorizada, verificación, recuperación, inicio/cierre de sesión y selección visible de empresa. Configurar direcciones de retorno, caducidades y SMTP propio para uso comercial [S06]. Evitar mensajes que revelen cuentas ajenas.
- **P18.** Crear la empresa y su primer administrador de forma atómica o con recuperación segura. Debe poder trabajar solo: inmuebles, contratos, cobros, gastos, incidencias, cierre, exportación y ajustes de su empresa según el plan. No exigir un gestor o un financiero adicional para completar operaciones.
- **P19.** Añadir invitaciones opcionales, roles y carteras asignadas; proteger la retirada o renuncia del último administrador activo. MFA para administradores antes de producción; probar recuperación y cambio de dispositivo.
- **P20.** Probar cambio entre empresas, revocación y operaciones simultáneas. El administrador cliente no accede a otras empresas ni a administración técnica global. El soporte usa acceso excepcional autorizado, limitado y auditado.

**Entrega:** acceso completo y matriz validada. **Avance G2:** A01 y la parte de BP01 relativa al alta, acceso y administración superadas; el recorrido unipersonal completo se verifica en P54 cuando estén construidos sus módulos. **BP01:** crear una empresa con una única persona, sin invitaciones ni portales; completar todo el recorrido permitido por su plan, incluida autoaprobación de liquidación con registro. Intentar eliminar al único administrador debe detenerse con una explicación útil. La auditoría no exige separación imposible de funciones.

## 10 Diseño minimalista y navegación

### P21 a P24 Construir un sistema visual reutilizable

**Responsables:** socio de producto y Lovable; técnico verifica accesibilidad. **Requisitos:** UX 01 a UX 14.

- **P21.** Definir mapa de pantallas: inicio, cartera, contactos, calendario/prealquiler, contratos, dinero, banco, liquidaciones, incidencias, documentos, informes y configuración. Mostrar según rol y plan; no sobrecargar Basic con acciones inactivas repetidas.
- **P22.** Crear componentes de navegación, tabla, búsqueda, filtros, formularios, estados, confirmación, avisos y ayuda. Usar una acción principal por pantalla; estados vacíos con siguiente paso; mensajes que expliquen cómo corregir el error sin perder datos.
- **P23.** Aplicar una propuesta visual: fondo #F7F9FC, superficies blancas, texto #172B4D, texto secundario #52637A, principal verde azulado #0F766E y apoyo #E6F4F1. Son colores propuestos, no identidad aprobada. Validar contraste en cada combinación y estado, foco, teclado y tamaños de interacción; no transmitir estados solo con color.
- **P24.** Validar prototipo en móvil y ordenador con datos ficticios. Pedir a una persona ajena al diseño que cree un inmueble, encuentre un saldo y registre una incidencia sin instrucciones. Registrar bloqueos y corregirlos antes de replicar componentes.

**Entrega:** guía visual, pantallas y resultados de uso. **Avance:** recorridos principales legibles y operables con teclado, sin desbordes ni acciones ambiguas. La aprobación visual no sustituye las pruebas de permisos y dinero.

## 11 Cartera contactos e importaciones

### P25 a P28 Crear datos operativos fiables

**Requisitos:** IMP 01 a 09, CAR 01 a 09 y CT 01 a 04. **Dependencia:** G2.

- **P25.** Implementar inmuebles, habitaciones/unidades, titulares, carteras y modalidad de explotación. Archivar sin eliminar registros vinculados. Distinguir empresa cliente de sociedades internas. Impedir relaciones entre empresas.
- **P26.** Crear contactos con múltiples relaciones posibles: una persona puede ser propietario y proveedor. Guardar solo identificación y datos necesarios; no crear automáticamente una cuenta de portal por ser contacto.
- **P27.** Crear plantillas CSV, mapeo de columnas, vista previa, validación por fila y resumen de cambios antes de confirmar. Definir identificador externo estable, política de duplicados y recuperación ante fallo parcial; no fiarse únicamente de nombres.
- **P28.** Importar una cartera sintética de dos viviendas y doce habitaciones dos veces; repetir después con 150 unidades. Introducir fechas inválidas, duplicados y referencias ajenas. Probar exportación CSV segura frente a fórmulas ejecutables en hojas de cálculo.

**Entrega:** cartera navegable, contactos y acta de importación con filas aceptadas/rechazadas. **Avance:** A02 sin duplicaciones; límites propuestos de archivo y filas se confirman con medición y se muestran al usuario. Conservar el fichero original protegido y su resultado durante el plazo que se acuerde.

## 12 Disponibilidad prealquiler y contratos

### P29 a P32 Evitar conflictos y cambios retroactivos

**Requisitos:** PRE 01 a 06 y CON 01 a 10. **Herramientas:** Lovable, PostgreSQL y funciones de servidor.

- **P29.** Construir disponibilidad, candidatos y solicitudes internas. Reservas con estado, expiración y liberación reintentable; no implican cobro de señal. Verificar los mismos conflictos al visualizar y al confirmar.
- **P30.** Implementar contratos y tramos con intervalo de entrada incluida y salida excluida. Validar solapes tanto entre ocupaciones de una habitación como entre vivienda completa y cualquiera de sus habitaciones. Bloquear concurrentemente los recursos afectados antes de confirmar; la comprobación solo en pantalla es insuficiente.
- **P31.** Añadir renta, vencimiento día 1 a 28, fianza, vigencia, participantes y documento firmado fuera del producto. Cambios de habitación y renta crean versiones/tramos; no reescriben la historia de obligaciones ya generadas.
- **P32.** Probar A03, A04, A13 y A14, incluidas dos confirmaciones simultáneas. Mostrar en calendario el último día ocupado y explicar qué significa fecha de salida. Probar fin de mes, febrero bisiesto y cambio de hora.

**Entrega:** calendario fiable y contrato reproducible con sus condiciones históricas. **Avance:** ningún conflicto produce dos ocupaciones válidas y no se alteran meses previos al modificar una renta futura.

## 13 Motor de dinero fianzas y gastos

### P33 a P36 Construir y revisar la parte de mayor riesgo

**Requisitos:** FIN 01 a 09, FIA 01 a 03, GAS 01 a 08 y REG 01 a 10. **Responsable de revisión:** técnico y persona que conozca la operación.

- **P33.** Crear operaciones de servidor para generar obligación, registrar cobro/pago, asignar, ajustar y devolver. Usar céntimos enteros o decimales exactos con regla común de redondeo. La transacción verifica usuario, empresa, rol, plan, importe, moneda y saldo disponible.
- **P34.** Proteger asignaciones contra carreras con bloqueo o mecanismo equivalente; usar claves únicas de generación por contrato/concepto/periodo/versión e idempotencia por solicitud. Una repetición devuelve el resultado previo, no otro cobro. Separar importe recibido, importe asignado y banco conciliado.
- **P35.** Implementar fianzas con movimientos propios y gastos con reparto igualitario o manual que conserve el total. No presentar fianza como renta. Registrar justificante, imputación, autorización de repercusión cuando proceda y reversión de errores; no borrar operaciones con dependencias.
- **P36.** Ejecutar A04 a A10, A13 y A20. Reconciliar sumas de pantalla, informe y exportación. Incluir importes negativos no permitidos, saldo insuficiente, doble clic, pérdida de conexión y dos sesiones. La IA debe entregar pruebas y el técnico revisar las transacciones.

**Ejemplos obligatorios:** 600 de renta con entrada 16/04 y salida 01/05 genera 300; cobrar 400 sobre 600 deja deuda 200; cobrar 650 sobre 600 deja 50 sin asignar; devolver 100 reabre el saldo correspondiente; repartir 100 entre tres unidades produce 33,34 + 33,33 + 33,33 en orden estable. A06 reparte 900 entre obligaciones de 600 y 300 sin crear más caja.

**Entrega:** motor y pruebas de invariantes económicas. **Avance:** no hay diferencia inexplicada de un céntimo ni modificación parcial. Un fallo aquí bloquea módulos dependientes y piloto con dinero real.

## 14 Incidencias documentos mensajes y tareas

### P37 a P40 Completar el núcleo de la V0

**Requisitos:** INC 01 a 08, TAR 01 a 02, DOC 01 a 06 y COM 01 a 05.

- **P37.** Crear incidencia con inmueble/unidad, descripción, prioridad, estado, responsable, presupuesto y resolución. Un gasto derivado se enlaza una sola vez y se crea mediante el motor económico. Tareas con vencimiento y responsable, también aptas para el administrador único.
- **P38.** Crear subida a almacenamiento privado con tamaño y tipo permitidos, nombres internos seguros y metadatos. Descargas mediante comprobación de permisos. Evitar enlaces públicos. Una URL firmada puede seguir viva hasta caducar; usar caducidad breve y acceso mediado si se exige revocación inmediata.
- **P39.** Separar notas internas y mensajes compartidos. Mostrar claramente destinatarios y visibilidad antes de enviar. Guardar notificaciones en cola con deduplicación, reintentos, estado y revisión de fallos [S10]. No enviar documentos sensibles como adjuntos sin necesidad.
- **P40.** Probar A17, A19 y A21, además de formatos engañosos, archivos rechazados y mensaje interno no visible en portal. Preparar exportación completa y recuperación de sección 20 antes de declarar V0 disponible.

**Entrega:** recorrido de mantenimiento y documentación de punta a punta. **Avance G3:** núcleo económico, permisos, exportación A23 y restauración A24 aprobados. V0 se presenta como piloto interno limitado; no se vende como V1 terminada.

## 15 Banco por CSV y conciliación

### P41 a P43 Añadir conciliación sin duplicar caja

**Requisitos:** BAN 01 a 09. **Dependencia:** motor de dinero estable.

- **P41.** Implementar importación CSV bancaria con mapeo, cuenta, formato de fecha, signo, moneda, resumen previo y huella de duplicados. Priorizar identificador bancario estable cuando exista; si se usa huella por campos, detectar colisiones y permitir revisión, pues dos movimientos legítimos pueden ser iguales.
- **P42.** Proponer coincidencias sin confirmarlas automáticamente. Enlazar movimiento con cobros/pagos existentes o crear uno nuevo de forma explícita y transaccional. Permitir varias relaciones conservando totales; separar comisión bancaria si procede. Nunca crear un cobro nuevo solo por seleccionar un cobro ya registrado.
- **P43.** Probar A11 y A12 con reimportación, conciliación de 900 con 600 + 300, importes parciales y desconciliación. Al deshacer, indicar si se conserva el cobro o se revierte; registrar motivo y actor. Probar acceso de Basic mediante petición directa y denegarlo según catálogo aprobado.

**Entrega:** lote reproducible y detalle de cada conciliación. **Avance:** saldo bancario importado, caja registrada y saldo pendiente se explican sin duplicación. No anunciar sincronización bancaria automática.

## 16 Liquidaciones portales e informes

### P44 a P47 Construir colaboración y control operativo

**Requisitos:** LIQ 01 a 09, POR 01 a 06 e INF 01 a 09.

- **P44.** Crear liquidación simple de agencia con comisión fija o porcentaje de renta cobrada, excluyendo fianza; participación de propietarios que suma 100 %. Copiar reglas y líneas aplicadas a una versión de liquidación. Aprobar y cerrar sin modificarla silenciosamente después; reapertura autorizada con historial.
- **P45.** Separar informe rent-to-rent de importe a liquidar a propietarios. Probar A15 con 1.000 − 100 − 50 = 850 y A16 con 2.400 − 1.500 − 200 − 100 = 600 de margen operativo simplificado. Mostrar base, pendientes y periodo; no llamar beneficio fiscal a ese resultado.
- **P46.** Crear portales separados por contexto: propietario solo sus activos y versiones aprobadas; inquilino solo su contrato/relación vigente o histórica autorizada; proveedor solo incidencias asignadas y presupuesto propio. La relación del contacto con cada registro limita el acceso y no depende solo del email.
- **P47.** Construir panel diario e informes con filtros, desglose y exportación. Distinguir devengo y caja; definir denominador de ocupación y fechas. Validar A14, A18 y A19, desvinculación, cambio de inquilino y acceso directo a documentos e informes ajenos.

**Entrega:** tres portales básicos, cierre simple y diccionario de informes con fórmulas. **Avance:** cada cifra permite llegar a sus líneas y cada usuario externo ve únicamente lo autorizado. Si un cliente no desea invitar a externos, la gestión interna continúa completa.

## 17 Planes prueba gratuita y cobro de nuestra cuota

### P48 a P52 Preparar la comercialización del SaaS

**Requisitos:** SaaS 01 a 13 y SOP 01 a 02. **Dependencias:** catálogo aprobado, identidad fiscal y proveedor de cobro elegido. Aquí se cobra el uso del software, no los alquileres de los clientes.

- **P48.** Crear catálogo versionado con Basic, Pro, Max y Enterprise, precio/moneda/periodicidad, capacidad, almacenamiento y derechos exactos. Guardar la versión contratada y los IDs del proveedor por entorno. Enumerar informes, portales y acciones permitidas; no usar etiquetas comerciales vagas como regla de permisos.
- **P49.** Implementar el motor de derechos en servidor: empresa, rol, relación con registro, estado de suscripción y función contratada. Aplicarlo a peticiones, funciones, consultas, informes, exportaciones específicas y trabajos programados. La exportación de salida de datos propios y las protecciones esenciales no se reservan a un plan caro.
- **P50.** Implementar la prueba de siete días Pro o Max con inicio/fin UTC decididos por servidor. Propuesta pendiente: una ventana de 168 horas por empresa, sin tarjeta y sin cobro automático; cambiar de Pro a Max mantiene el fin original. Iniciar cuando la empresa esté habilitada; no mientras una invitación espere aceptación. Invitados heredan el periodo de su empresa.
- **P51.** Integrar Stripe Checkout/Billing y portal de facturación si se elige Stripe. Verificar firma de eventos, persistir ID único, procesar reintentos y eventos desordenados, consultar el estado autoritativo cuando proceda y vincular el cliente del proveedor a nuestra empresa en servidor. La página de éxito del navegador no activa por sí sola el plan [S12, S13].
- **P52.** Probar A22 y A26 a A29; añadir vencimiento sin trabajo programado, pago fallido, recuperación, baja al fin de periodo, cambio de precio y exceso de capacidad. Al bajar de plan, conservar historia y bloquear nuevas operaciones no contratadas; explicar el efecto antes de confirmar. Configurar Enterprise mediante oferta y derechos registrados, sin permisos ilimitados implícitos.

**Un único reloj de prueba:** si se adopta prueba sin tarjeta gestionada en nuestra base, no crear otra prueba independiente de siete días en Stripe. Determinar expresamente qué pasa al contratar antes del vencimiento: cobro inmediato consentido o inicio al final de la prueba. Hasta aprobarlo, no construir una conversión que pueda sorprender al usuario. La documentación de Stripe permite pruebas, pero la integración concreta requiere una sola fuente de verdad [S14].

**Caducidad:** comprobar el fin en cada operación de servidor, además del proceso programado de avisos. Si un trabajo se retrasa, no prolongar derechos. Mostrar fecha local exacta, condiciones, avisos de fin y opciones de contratación. No activar Basic gratuito. No borrar datos al vencer ni al fallar una tarjeta; aplicar consulta/exportación y conservación conforme a condiciones aprobadas.

**Entrega:** tabla comercial consistente con permisos y cobros. **Avance G4:** modo de pruebas completo, ningún cobro inesperado y todas las rutas de permisos verificadas. No activar dinero real antes de G6 y aprobación de lanzamiento.

## 18 Pruebas y evidencias de calidad

### P53 a P55 Probar el sistema completo

**Responsable:** técnico; el socio operativo valida resultados. **Herramientas:** pruebas automáticas, navegador y datos sintéticos, con evidencias en GitHub.

- **P53.** Automatizar cálculos, restricciones, migraciones, políticas RLS y funciones transaccionales. Añadir pruebas de contrato para eventos de pago y correo. Cada prueba debe intentar un fallo real y comprobar estado final, no solo que se llamó una función.
- **P54.** Ejecutar los 29 casos A01 a A29 de la especificación y BP01 a BP08 de esta guía. Hacer regresión de los recorridos afectados tras cada cambio; ejecutar la batería completa antes de una versión candidata. Probar en ordenador y móvil, navegadores de uso previsto, teclado y lector de pantalla en recorridos esenciales.
- **P55.** Medir rendimiento y estabilidad con cartera sintética de 150 unidades, 36 meses, tres empresas y diez sesiones según el escenario de la especificación. Definir antes qué páginas/operaciones se miden, conexión, caché y número de repeticiones. Registrar percentil 95, errores y consultas lentas; objetivo propuesto inferior a tres segundos para las operaciones acordadas, sin promesa no medida.

| Prueba adicional | Ejecución | Resultado exigido |
|---|---|---|
| BP01 Empresa unipersonal | Un administrador completa el recorrido sin compañeros | Sin bloqueos artificiales y último administrador protegido |
| BP02 Revocación y archivos | Revocar miembro y repetir descarga y petición directa | Acceso nuevo rechazado; caducidad residual documentada y acotada |
| BP03 Reloj de prueba | Simular instante anterior, exacto y posterior al fin; retrasar tarea | Derechos correctos por servidor, sin depender del navegador |
| BP04 Entornos | Buscar una marca ficticia exclusiva de dev desde prod | No aparece; claves y destinos verificados |
| BP05 Publicación | Cambiar dev, publicar revisión aprobada y volver atrás | Producción no cambia sola y versión identificable |
| BP06 Reintentos y orden | Repetir/desordenar eventos de pago y generación mensual | Estado final único y correcto |
| BP07 Fechas y simultaneidad | Cambio horario, febrero y dos altas simultáneas | Sin día desplazado ni doble ocupación/asignación |
| BP08 Restauración completa | Restaurar en entorno limpio y comprobar identidad, datos y archivos | Acceso seguro, saldos y relaciones correctos; sin correos/cobros reales |

**Evidencia mínima por prueba:** ID, versión exacta de código y migraciones, entorno, datos de entrada, resultado esperado/obtenido, fecha, ejecutor y referencia a captura o informe sin datos sensibles. Las pruebas no ejecutadas se marcan pendientes, nunca superadas por lectura de código.

**Severidad:** crítico implica exposición/corrupción/cobro indebido; alto bloquea una tarea esencial sin alternativa segura; medio tiene alternativa documentada; bajo afecta presentación o comodidad. Lanzar con cero críticos y altos abiertos, y con los restantes aceptados expresamente y calendarizados.

## 19 Revisión de seguridad privacidad y obligaciones comerciales

Antes de datos reales, inventariar información y fines, roles jurídicos, bases de tratamiento, ubicación, transferencias y proveedores. La AEPD distingue responsable y encargado y exige concretar el encargo cuando corresponda [S18]. Para nuestro SaaS pueden existir papeles distintos en datos de alquiler y datos de contratación de nuestra propia cuota; una persona competente debe revisar el mapa real.

Revisar condiciones de servicio, privacidad, cookies si proceden, encargo de tratamiento, subencargados, soporte, conservación, baja, exportación y respuesta a incidentes. La elección de región europea no acredita por sí sola toda la conformidad. Evitar datos reales de arrendatarios en prompts o capturas; utilizar datos ficticios o minimizados y evaluar las condiciones de cada herramienta.

Comprobar claves ausentes del navegador y del historial Git; rotar cualquier secreto expuesto y documentar el incidente. Revisar dependencias, autenticación, rate limits, intentos masivos, subida/descarga, permisos, cabeceras, registros sin datos sensibles y administración de soporte. Un análisis automático de Lovable es una comprobación adicional, no una auditoría integral.

**Facturación:** diferenciar informes operativos de alquiler de facturas fiscales. No afirmar que renombrar una factura como recibo la excluya de obligaciones. Revisar con asesor la venta de nuestras cuotas y cualquier futura emisión fiscal para clientes. La AEAT delimita cuándo un sistema y un obligado entran en el ámbito de los SIF; Stripe o una plantilla PDF no acreditan por sí solos cumplimiento [S19].

**Salida:** checklist firmado con alcance de revisión, hallazgos, correcciones y pendientes. Si no se ha realizado revisión técnica/legal necesaria, el documento debe mostrarlo como bloqueo del lanzamiento; no sustituirla con una declaración genérica de cumplimiento.

## 20 Exportación copias y recuperación

### P56 a P58 Demostrar continuidad antes del piloto

**Requisitos:** BAK 01 a 04, SEG 01 a 07, A23 y A24. **Responsables:** técnico ejecuta, ambos socios saben localizar y solicitar recuperación.

- **P56.** Implementar exportación de una empresa con tablas legibles, IDs/relaciones, documentos originales y manifiesto de archivos con tamaño/huella. Probar recuentos, ficheros ausentes, permiso del solicitante y ausencia de otras empresas. Un CSV de inmuebles no es exportación completa.
- **P57.** Programar copias de base, objetos de Storage y configuración necesaria, cifradas y con destino independiente. Incluir esquema/migraciones, funciones, configuración de Auth, roles/permisos, parámetros del proveedor y procedimiento de secretos. No copiar todo a un repositorio de código. Las copias de base de Supabase no incluyen los objetos de Storage [S08].
- **P58.** Restaurar en un entorno limpio, desactivando correos, eventos reales y tareas externas. Comprobar cuentas y recuperación de acceso, contrato, saldos, relaciones y documentos. Verificar cómo se preservan o reconfiguran identidades, MFA, proveedores de acceso y secretos; no asumir que un volcado de tablas restituye todo Auth. Registrar diferencias y repetir.

**Objetivos propuestos:** pérdida máxima de 24 horas y recuperación en un día laborable; requieren pruebas para aceptarse. Definir frecuencia, retención y responsable de alertas. Si la operación exige menos pérdida, estudiar copias más frecuentes o recuperación puntual y coste adicional. Ver una tarea de copia en verde no demuestra que se pueda restaurar.

**Recuperación resumida:** contener el problema y congelar cambios; identificar última copia íntegra; preparar entorno aislado; restaurar base, objetos y configuración; validar con BP08; reconciliar eventos externos posteriores a la copia; decidir reapertura; informar según obligaciones y registrar causa. No restaurar toda producción para corregir un único registro sin valorar la pérdida de cambios de otras empresas.

**Continuidad de los socios:** código y documentación local para cada socio; datos de clientes solo según rol y necesidad, con cifrado y acceso revocable. No duplicar indiscriminadamente datos personales en dos ordenadores. El plan de continuidad debe proteger a los clientes además de preservar el proyecto.

## 21 Despliegue controlado y vuelta atrás

### P59 a P61 Preparar una publicación repetible

**Responsable:** técnico; aprobación comercial de ambos socios. **Dependencias:** G4 y restauración probada.

- **P59.** Preparar una versión candidata desde main con identificador de revisión, migraciones, notas de cambio y resultados. El procedimiento de despliegue debe aceptar esa revisión concreta, ejecutar comprobaciones y exigir una acción autorizada de publicación. Revisar funciones disponibles del plan GitHub: no suponer que toda aprobación de entornos privados está incluida en Team [S11].
- **P60.** Separar despliegue de estructura, funciones y aplicación. Revisar copia reciente, compatibilidad y variables del destino. Aplicar migraciones previamente ensayadas y generar la aplicación con configuración de producción. No promover un archivo compilado contra Supabase dev como si cambiara mágicamente a prod. Los secretos no deben aparecer en registros.
- **P61.** Publicar primero sin abrir nuevas altas, comprobar acceso, permisos, consulta, archivo y suscripción con cuenta controlada; verificar alarmas y versión mostrada. Si se supera el control, habilitar el servicio. Conservar el paquete anterior y un plan de retorno probado.

Los proveedores pueden publicar automáticamente cada cambio del repositorio [S16]. Desactivar o limitar esa ruta de producción y demostrarlo mediante BP05. Si se usa un flujo manual de GitHub, verificar quién puede ejecutarlo y qué revisión permite; no llamar doble aprobación a un botón que puede pulsar una sola persona sin restricción.

**Vuelta atrás:** primero determinar si basta volver al código anterior. Diseñar cambios de base compatibles mediante ampliar antes y retirar después; evitar eliminar columnas utilizadas por la versión anterior en la misma publicación. Una migración destructiva necesita copia, plan específico y ensayo. Restaurar datos es una operación distinta de volver al código y puede perder cambios legítimos. Congelar escrituras cuando sea necesario y reconciliar Stripe/correo tras recuperar.

**Entrega:** manual de publicación con prerrequisitos, responsable, acciones exactas generadas para el proyecto, comprobación y ruta de emergencia. No copiar comandos genéricos sin verificar framework, host y destinos.

## 22 Piloto y lanzamiento comercial

### P62 a P64 Validar operación y autorizar salida

**Responsables:** socios, técnico y participantes autorizados. **Herramientas:** aplicación, soporte y registro de incidencias.

- **P62.** Acordar piloto, participantes, datos permitidos, duración, soporte y criterio de éxito. La actividad de 150 habitaciones del socio es una posibilidad, no autorización de acceso. Empezar con cartera sintética y, tras autorización y revisión, una cartera real limitada. Mantener referencia independiente para contrastar saldos.
- **P63.** Completar un ciclo operativo: alta/importación, contrato, vencimiento, cobro parcial, gasto, incidencia, conciliación y cierre. Si el periodo natural no termina, simular fechas controladas y declarar la limitación. Incorporar pruebas con clientes de cada modelo que se vaya a comercializar; no afirmar validación de un segmento que no participó.
- **P64.** Reunir evidencias G0 a G6, aprobar precios/condiciones, soporte y publicación. Abrir altas de forma gradual y vigilar resultados. Pedir autorización específica para publicación, cobros y comunicaciones externas cuando corresponda; la aprobación documental no la sustituye.

**Criterios propuestos de piloto para acordar:** todos los recorridos esenciales completados, ninguna diferencia económica sin explicar, aislamiento confirmado, recuperación ejecutada, ninguna incidencia crítica/alta abierta y tareas esenciales realizadas por un usuario sin acompañamiento continuo. Registrar además tiempo dedicado, dudas repetidas y motivos de abandono; el piloto no prueba por sí solo demanda amplia ni disposición a pagar.

**Paquete antes de cobrar:** catálogo exacto, condiciones visibles, contratación/cancelación probadas, facturación validada, ayuda básica, canal de soporte con responsable, procedimiento de incidentes, alertas activas, presupuesto mensual y reserva para mantenimiento. No prometer soporte 24/7 o SLA contractual sin capacidad real.

## 23 Calendario y responsabilidades

El 12 de noviembre de 2026 queda a 24 días del 19 de octubre. Con la V1 propuesta no se considera una fecha garantizada de producto comercial. Puede servir como objetivo de prototipo navegable o V0 parcial si se resuelven accesos y reglas pronto. La estimación anterior de 10 a 18 semanas para V1 sigue siendo orientativa y debe recalcularse después de G1 y la validación del núcleo financiero.

| Periodo orientativo | Trabajo principal | Resultado y dependencia |
|---|---|---|
| Semana 1 | G0, cuentas previstas, repositorio y demostración técnica | G1; si falla, revisar plataforma antes de seguir |
| Semanas 2 y 3 | Esquema, permisos, acceso y diseño base | G2 y cartera sintética |
| Semanas 4 a 6 | Contratos, dinero, gastos e incidencias | Núcleo V0 y G3 tras recuperación |
| Semanas 7 a 10 | Banco, liquidaciones, portales e informes | V1 funcional integrada |
| Semanas 9 a 12 | Planes, prueba, cobro y soporte | G4; puede solaparse con tareas independientes |
| Semanas 12 a 14 | Revisión, piloto y correcciones | G5 y preparación de G6 |
| Reserva hasta semana 18 | Fallos, revisiones y complejidad no descubierta | No sustituye evidencia para lanzar |

Esta tabla es una planificación propuesta, no una suma de plazos garantizados. El trabajo paralelo exige responsables y entornos que no se interfieran. Si no hay apoyo técnico disponible, no mantener las mismas fechas por asumir que la IA sustituye la revisión.

**Socio de producto:** reglas y prioridades, validación de pantallas y operación. **Socio de negocio/pagador:** presupuesto, titularidad, oferta, contratos y soporte comercial. **Responsable técnico:** arquitectura, permisos, dinero, pruebas, migraciones, publicación y recuperación. **Revisor legal/fiscal:** obligaciones y condiciones del servicio. Las personas concretas y su disponibilidad siguen pendientes; una misma persona puede cubrir varios papeles si tiene capacidad, dejando el control documentado.

## 24 Prompts para trabajar con ChatGPT y Lovable

Sustituir los datos entre corchetes antes de usar. Adjuntar únicamente la documentación necesaria y datos ficticios. Los prompts son instrucciones de trabajo; no acreditan que la tarea esté hecha ni autorizan publicación o compras. La IA debe indicar archivos cambiados, pruebas ejecutadas y limitaciones reales.

### Plantilla 1 Preparar una tarea en ChatGPT

Actúa como responsable de producto y arquitectura del proyecto REAL ESTATE SOFTWARE. Lee la especificación V1.1 y el blueprint aprobado. Prepararás únicamente el paso [Pxx] y requisitos [códigos]. Explica prerrequisitos, entidades afectadas, permisos, derechos por plan, recorrido de empresa unipersonal, errores y pruebas de aceptación. Separa confirmado, propuesto y pendiente. Si falta una regla con efecto económico o comercial, detén esa parte y señala la decisión necesaria. Entrega una tarea lista para Lovable y criterios que permitan verificarla. No amplíes alcance ni inventes integraciones.

### Plantilla 2 Construir una función en Lovable

Implementa solo [recorrido] conforme a [requisitos y versión]. Respeta los componentes y la arquitectura existentes. El backend de desarrollo es [identificador verificado]; no conectes producción. Antes de modificar, resume los archivos y migraciones previstos. Comprueba empresa, rol, relación y plan en servidor. Añade carga, vacío, error, éxito y conflicto; conserva el formulario si falla. No introduzcas secretos en código cliente ni migres a otro backend. Entrega cambios, pruebas y forma de comprobar el resultado con datos ficticios. No publiques producción.

### Plantilla 3 Crear esquema y políticas

Diseña la migración mínima para [entidades]. Toda entidad de negocio pertenece a una empresa y todas sus relaciones deben respetarla. Genera restricciones, índices, RLS, políticas de Storage y pruebas positivas/negativas con tres empresas. Revisa funciones privilegiadas y privilegios mínimos. Incluye prueba de reconstrucción desde cero y actualización desde la versión anterior. No declares seguridad solo porque la interfaz oculta registros.

### Plantilla 4 Revisar una operación económica

Revisa [operación y cambios] contra REG 01 a REG 10 y los casos [Axx]. Comprueba importes exactos, atomicidad, idempotencia, concurrencia, empresa, rol y plan. Demuestra el estado de obligación, cobro, asignación, banco y fianza antes y después. Incluye doble clic, reintento tras desconexión y dos sesiones simultáneas. Señala cualquier cálculo en el navegador o saldo que pueda volverse negativo indebidamente. No apruebes la tarea sin evidencia ejecutada.

### Plantilla 5 Revisar una entrega

Revisa la diferencia de código de [versión] y las pruebas de [entorno]. Contrástala con requisitos [códigos]. Busca regresiones, datos entre empresas, permisos de archivos, secretos, derechos por plan, migraciones incompatibles y tareas duplicadas. Clasifica hallazgos por impacto, con recorrido reproducible y corrección propuesta. Distingue lectura de código de pruebas realmente ejecutadas. No modifiques módulos ajenos para embellecer la entrega.

### Plantilla 6 Preparar publicación

Prepara el expediente de publicación de [revisión exacta] conforme al manual del proyecto. Lista pruebas, migraciones, configuración por entorno, copia/restauración, riesgos, verificaciones posteriores y vuelta atrás. Comprueba que no hay auto publicación de cambios de desarrollo y que el compilado usa producción. Indica bloqueos y acciones pendientes. No publiques ni actives cobros reales: entrega el resultado concreto para autorización.

### Plantilla 7 Resolver una incidencia

Analiza [síntoma] en [entorno y versión] usando registros sin datos personales. Explica impacto, contención segura, hipótesis comprobables y cambio mínimo. Distingue problema de interfaz, permiso, datos, proveedor y despliegue. No restaures producción ni borres registros como primera medida. Entrega una prueba que reproduzca el fallo y otra que demuestre la corrección; revisa efectos en saldos, accesos y eventos externos.

## 25 Trazabilidad entre especificación construcción y pruebas

La siguiente matriz cubre las 24 familias y los 175 códigos de V1.1. Los rangos incluyen todos los números intermedios. Durante la ejecución se sustituirán los rangos por tareas y evidencias individuales cuando sea necesario; esta tabla no marca ningún requisito como implementado.

| Requisitos de V1.1 | Pasos principales | Evidencias de aceptación |
|---|---|---|
| ACC 01 a 09 | P13 a P20 | A01 y BP01 a BP02; sesión, MFA y recuperación |
| UX 01 a 14 | P21 a P24 | Revisión móvil, teclado, estados y uso observado |
| IMP 01 a 09 | P25 a P28 | A02, A23; errores y reimportación |
| CAR 01 a 09 | P25 a P32 | A02 a A03, A14; archivo sin pérdida |
| CT 01 a 04 | P26 y P46 | A01, A18 a A19; contactos y relaciones |
| PRE 01 a 06 | P29 a P32 | A03 y BP07; vencimiento de reserva |
| CON 01 a 10 | P29 a P36 | A03 a A04, A13 a A14 |
| FIN 01 a 09 | P33 a P36 | A05 a A08, A13 y A20 |
| FIA 01 a 03 | P35 a P36 | A09 y separación de caja/renta |
| GAS 01 a 08 | P35 a P37 | A10 y A17; repercusión y reversión |
| BAN 01 a 09 | P41 a P43 | A11 a A12 y acceso por plan |
| LIQ 01 a 09 | P44 a P45 | A15 a A16; cierre y reapertura |
| INC 01 a 08 | P37 a P40 | A17, A19 y BP01 |
| TAR 01 a 02 | P37 a P40 | Tarea, vencimiento y responsable único |
| DOC 01 a 06 | P38 a P40 y P56 | A19, A23, BP02 |
| COM 01 a 05 | P39 a P40 | A21; mensajes internos y cola |
| POR 01 a 06 | P46 a P47 | A14, A18 a A19 y BP02 |
| INF 01 a 09 | P44 a P47 y P55 | A15 a A16, A25; fórmulas y desglose |
| SaaS 01 a 13 | P48 a P52 | A22, A26 a A29, BP03 y BP06 |
| SOP 01 a 02 | P52 y P62 a P64 | Solicitud, error, mantenimiento e incidente |
| REG 01 a 10 | P13 a P16 y P30 a P45 | A04 a A16, A20 y BP07 |
| SEG 01 a 07 | P13 a P20 y P53 a P61 | A01, A19 a A22 y revisión de seguridad |
| BAK 01 a 04 | P56 a P58 | A23 a A24 y BP08 |
| CAL 01 a 04 | P53 a P55 y P62 a P64 | A25 y expediente de calidad |

Todos los casos A01 a A29 deben tener resultado y evidencia antes de G6. Los rangos de esta matriz se complementan con los pasos y resultados de las secciones anteriores.

## 26 Operación después del lanzamiento

**Cada día laborable:** revisar alertas, trabajos fallidos, entregas de correo, eventos de pago pendientes y resultado de copias. Asignar incidentes y comprobar que el soporte tiene cobertura. Si se contrata otra cobertura, el acuerdo debe reflejarla.

**Cada semana:** revisar errores repetidos, coste y uso por empresa, tiempos de respuesta y solicitudes; priorizar correcciones sobre ampliaciones que afecten estabilidad. Publicar cambios mediante el mismo procedimiento de pruebas y despliegue. Evitar que Lovable trabaje contra producción para arreglar deprisa.

**Cada mes:** probar una muestra de restauración o el ejercicio completo según riesgo acordado, revisar accesos administrativos, dependencias y gasto real, y actualizar ayuda. Ejecutar restauración completa tras cambios importantes de base/Storage/Auth, además de la periodicidad pactada.

**Cada nueva función:** actualizar requisitos, catálogo si afecta planes, migraciones, permisos, pruebas, ayuda y versión. Validar precio y coste antes de prometerla. Una nueva función Max no amplía automáticamente contratos anteriores si el catálogo versionado dispone otra cosa; comunicar cambios de forma coherente con las condiciones.

**Registro de decisiones:** fecha, decisión, fuente, responsable y efecto en datos/coste/plazo. Mantener documentos, repositorio e inventario consistentes. Los historiales de ChatGPT y Lovable son apoyo, no la única memoria operativa del negocio.

## 27 Lista final y situación de este documento

Antes de declarar el software listo para mercado deben estar completos G0 a G6; 175 requisitos con evidencia o exclusión de alcance aprobada; 29 casos de aceptación y ocho pruebas adicionales; revisión técnica de dinero y permisos; privacidad/fiscalidad revisadas; copia restaurada; despliegue y vuelta atrás ensayados; precios y condiciones visibles; soporte y responsables activos.

**Situación real al entregar este blueprint:** documentación preparada y contrastada con capacidades públicas. No se han creado cuentas, comprado planes, escrito la aplicación ni ejecutado sus pruebas. Todos los pasos P01 a P64 están pendientes de implementación. Los tiempos son estimaciones y no hay presupuesto ni catálogo comercial aprobados.

**Primer siguiente trabajo propuesto:** resolver G0 con una tabla de decisiones y ejecutar P09 a P12 como demostración técnica acotada una vez autorizado. Ese ejercicio determinará compatibilidad, aislamiento, coste y método de publicación antes de invertir en el resto. La aceptación de esta guía no debe interpretarse como aprobación implícita de precios o capacidades que todavía figuran como propuestas.

## 28 Fuentes oficiales y alcance de la verificación

Consultadas el 19 de octubre de 2026. Respaldan capacidades y limitaciones de proveedores; no certifican nuestra futura implementación. Los procedimientos y controles de calidad de esta guía son recomendaciones de diseño que deben ejecutarse y comprobarse.

- **S01. Lovable y propiedad del código y alojamiento.** Exportación, modalidades de despliegue y diferencias entre tecnologías generadas. https://docs.lovable.dev/tips-tricks/deployment-hosting-ownership
- **S02. Lovable y GitHub.** Conexión, sincronización y selección de rama; permisos de la integración. https://docs.lovable.dev/integrations/github
- **S03. Lovable y Supabase.** Integración con proyecto propio y consideraciones de conexión/migración. https://docs.lovable.dev/integrations/supabase
- **S04. Supabase y entornos.** Desarrollo y despliegue de cambios entre entornos. https://supabase.com/docs/guides/deployment/managing-environments
- **S05. Supabase y RLS.** Políticas de acceso a filas y comportamiento de claves privilegiadas. https://supabase.com/docs/guides/database/postgres/row-level-security
- **S06. Supabase y correo de autenticación.** SMTP propio para autenticación. https://supabase.com/docs/guides/auth/auth-smtp
- **S07. Supabase y archivos.** Control de acceso a Storage. https://supabase.com/docs/guides/storage/security/access-control
- **S08. Supabase y copias.** Cobertura y limitaciones de los backups de base de datos. https://supabase.com/docs/guides/platform/backups
- **S09. ChatGPT Work.** Trabajo con tareas, documentos, archivos y herramientas; disponibilidad concreta por verificar en la cuenta. https://learn.chatgpt.com/docs/get-started-with-work
- **S10. Supabase y trabajos programados.** Ejecución periódica de funciones, que requiere configuración y control de errores propios. https://supabase.com/docs/guides/functions/schedule-functions
- **S11. GitHub y controles.** Protección de ramas y funciones de entornos sujetas al plan y tipo de repositorio. https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- **S11 continuación. GitHub y entornos.** Revisar disponibilidad antes de prometer aprobaciones de producción. https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments
- **S12. Stripe y webhooks.** Verificación y recepción de eventos. https://docs.stripe.com/webhooks
- **S13. Stripe e idempotencia.** Repetición segura de solicitudes al proveedor; el sistema también necesita su propia deduplicación. https://docs.stripe.com/api/idempotent_requests
- **S14. Stripe y pruebas de suscripción.** Opciones del proveedor para periodos gratuitos. https://docs.stripe.com/billing/subscriptions/trials
- **S15. Vercel y plan Hobby.** Restricciones de uso; validar plan comercial y coste si se elige este host. https://vercel.com/docs/plans/hobby
- **S16. Vercel y GitHub.** Publicaciones automáticas por integración Git; controlar producción explícitamente. https://vercel.com/docs/git/vercel-for-github
- **S17. Vercel y entornos.** Configuración de desarrollo, vista previa y producción. https://vercel.com/docs/deployments/environments
- **S18. AEPD y responsable y encargado.** Roles y obligaciones del encargo de tratamiento. https://www.aepd.es/preguntas-frecuentes/2-tus-obligaciones-como-responsable-del-tratamiento/8-responsable-y-encargado-del-tratamiento
- **S19. AEAT y ámbito de los sistemas de facturación.** Delimitación que deberá revisar el asesor según la función real del producto y del prestador. https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/preguntas-frecuentes/cuestiones-generales-ambitos-aplicacion.html
