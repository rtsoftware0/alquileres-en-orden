# Tabla de decisiones para cerrar G0

REAL ESTATE SOFTWARE | Versión 1.2 | 21/10/2026

Estado: E1–E9, C1–C7 y T1–T6 aprobados como base inicial el 21/10/2026. Fuente: mensaje del usuario «Apruebo E, C y T como base inicial. Guarda las decisiones y explícame qué falta resolver del bloque O antes de avanzar.» G0 sigue abierto por el bloque O. Esta aprobación no autoriza construcción, compras, publicación, borrados ni cambios de acceso. Complementa el acta del 19/10 sin sustituir la especificación V1.1. Se omite el inventario general de identidades/cuentas por instrucción del 21/10.

## Confirmado: no necesita nueva aprobación

| Tema | Decisión vigente |
|---|---|
| Producto y alcance | SaaS integral para vender a terceros y uso propio; V1.1 como alcance funcional. |
| Herramientas | ChatGPT Pro/Work, Lovable, Supabase propio y GitHub; el usuario no escribe código. |
| Oferta | Basic, Pro, Max y Enterprise; siete días gratuitos en Pro y Max. |
| Operación | Una empresa cliente puede funcionar con un único administrador de sus funciones contratadas. |
| Diseño | Minimalista, fácil de usar y atractivo; paleta concreta pendiente. |
| Presupuesto | Total mensual de 300 €; paga el socio. No supone gastos extraordinarios aprobados. |
| Forma de avanzar | Aprobar cada alcance concreto, completarlo y verificarlo; esperar antes del siguiente paso. |

## E — Reglas económicas: aprobadas como base inicial

Se adoptan REG 01–10 y los detalles siguientes como reglas iniciales del producto. Son decisiones de diseño, no asesoramiento sobre qué importes permite cobrar un contrato particular.

| ID | Recomendación | Ejemplo o consecuencia |
|---|---|---|
| E1 | EUR, dos decimales; redondeo comercial por concepto y suma de líneas redondeadas. Repartos iguales o manuales; céntimos sobrantes asignados por orden estable de unidades. | 100 € entre tres: 33,34 + 33,33 + 33,33 = 100 €. |
| E2 | Entrada incluida y salida excluida. Primera y última renta por días naturales del mes. | A04: renta 600 €, entrada 16/04 y salida 01/05: quince días de abril, 600 × 15/30 = 300 €. Salida 30/04 significaría último día ocupado 29/04. |
| E3 | Vencimiento mensual configurable del 1 al 28. | Un vencimiento el día 5 funciona todos los meses; día 31 no se admite en V1. Esta simplificación puede no encajar con todos los contratos. |
| E4 | Separar deuda, dinero recibido, asignación y conciliación bancaria. Excesos como saldo sin asignar. | Cobrar 400 de 600 deja 200 pendientes; recibir 650 deja 50 sin asignar. Conciliar el banco no vuelve a sumar el cobro. |
| E5 | Fianza separada de renta y margen. Gastos con responsable económico, justificante y pagos separados. | Una fianza de 600 no incrementa ingresos por alquiler. Un gasto de 120 repartido entre cuatro unidades genera 30 por unidad solo tras confirmación. |
| E6 | Generaciones sin duplicados; operaciones completas o sin efecto y protección frente a dos usuarios simultáneos. | Doble clic no genera dos mensualidades; dos personas no pueden asignar el mismo saldo dos veces. |
| E7 | Cambios con fecha efectiva y correcciones mediante ajuste/reversión, sin borrar historia. Cierre bloqueado, reapertura motivada. | Cambiar renta desde junio no modifica abril; devolver 100 de un cobro asignado reabre 100 de deuda. El administrador único puede autoaprobar dejando registro. |
| E8 | Agencia: honorario fijo o porcentaje de renta cobrada y asignada, recibida en el mes; excluir fianzas. | 1.000 cobrados − 100 de honorario − 50 de gasto = 850 operativos, antes de ajustes fiscales y saldos anteriores. |
| E9 | Rent-to-rent: obligación fija al propietario y margen del operador separados; distinguir caja, devengo y pagos pendientes. | 2.400 − 1.500 − 200 − 100 = 600 de margen operativo simplificado; no beneficio fiscal. |

## C — Catálogo comercial: aprobado como base inicial

Se aprueban los precios y capacidades siguientes como base inicial para validar, no como precios ya demostrados por el mercado. Mensuales por empresa y antes de impuestos aplicables; sin permanencia ni descuento anual inicial. Aprobar este catálogo no autoriza publicarlo o cobrarlo. Rentabilidad y disposición a pagar siguen sin medir.

| Plan | Precio inicial aprobado | Unidades activas | Usuarios internos | Archivos | Funciones iniciales aprobadas |
|---|---:|---:|---:|---:|---|
| C1 Basic | 19 €/mes | 10 | 1 | 1 GB | Cartera, contactos, contratos, dinero manual, incidencias/documentos internos, importación/exportación, calendario de consulta e informes básicos. |
| C2 Pro | 49 €/mes | 50 | 3 | 5 GB | Basic más prealquiler, calendario completo, banco CSV, conciliación, repartos/liquidaciones simples, portales de propietario e inquilino e informes financieros. |
| C3 Max | 99 €/mes | 150 | 5 | 15 GB | Pro más portal de proveedor y todos los informes V1, con mayor capacidad. |
| C4 Enterprise | Desde 199 €/mes orientativos; oferta individual | Acordadas y probadas | Acordados | Acordados | Alcance V1 con capacidad, incorporación y servicio definidos; sin funciones aplazadas o desarrollos ilimitados implícitos. |

| ID | Regla inicial aprobada | Ejemplo |
|---|---|---|
| C5 | Contar unidades gestionadas activas, incluidas vacantes y reservadas; no contar otra vez la vivienda contenedora. | Una vivienda dividida en cinco habitaciones cuenta cinco unidades, no seis. |
| C6 | Externos no consumen plaza interna; acceso restringido y consumo controlado. | Tres gestores y veinte inquilinos invitados consumen tres plazas internas. |
| C7 | Avisar antes del límite; bloquear nuevas altas/subidas excedidas sin cobros automáticos ni borrado de historia. | Pro con 50 unidades no permite la 51 sin ampliar; los datos existentes siguen accesibles según permisos. |

La asignación exacta de los nueve informes INF debe enumerarse antes de implementar derechos. Las capacidades son objetivos comerciales a comprobar, no rendimiento certificado. Todos los planes conservan protección de datos y exportación de salida.

## T — Prueba y suscripciones: aprobadas como base inicial

| ID | Recomendación | Ejemplo o límite |
|---|---|---|
| T1 | Una ventana de 168 horas por empresa, sin tarjeta obligatoria; comienza al habilitar funciones. Cambiar Pro/Max no reinicia. | Cambiar a Max el tercer día deja el tiempo restante de la misma prueba, no otros siete días. Mostrar hora local exacta de fin, también si cambia el horario estacional. |
| T2 | Límites de unidades/usuarios del plan elegido; 500 MB de archivos durante prueba; avisos 24 horas antes y al vencer. | Max de prueba: 150 unidades, cinco internos y 500 MB, no los 15 GB del plan de pago. |
| T3 | Sin contratación: sin cargo, sin nuevas operaciones de pago y 30 días de consulta/exportación. | Basic no se activa gratis. La retención posterior necesita política acordada; esto no autoriza borrar datos. |
| T4 | Contratar durante la prueba conserva el tiempo restante; cuota y derechos del plan comprado empiezan al vencimiento original con consentimiento y pago verificado. | Si prueba Max y elige Basic el día 3, mantiene Max hasta el fin; después comienza Basic si el pago se confirma. |
| T5 | Subidas de clientes de pago: importe/fecha visibles y confirmados; activar tras pago verificado. Bajadas al final del periodo pagado. | Pro → Max: mostrar el ajuste antes de cobrar. Max → Pro con más de 50 unidades: preservar historia y bloquear nuevas altas excedidas. |
| T6 | Cancelar evita renovación y conserva acceso hasta fin pagado. Impago: siete días de gracia y luego 30 días de consulta/exportación desde restricción. | No borrar datos por fallo de tarjeta. Las condiciones y conservación deben revisarse antes de vender. |

Motivo de la decisión inicial sin tarjeta: permite probar sin compromiso de cobro. Contrapartida: facilita altas poco comprometidas y exige controles proporcionados contra repetición de pruebas. Es una elección de producto; no una mejora de conversión demostrada.

## O — Operación, presupuesto y decisiones que faltan

Actualización posterior del 21/10/2026: el usuario deja el presupuesto económico en segundo plano para centrarse en crear el software. O2/O3 y la solicitud del importe de Lovable quedan aplazados; no son prerrequisitos para preparar el siguiente paso. Lovable Pro con 400 créditos mensuales ya pagados es información comunicada por el usuario. La reserva anterior de 40 € no es un coste real. Los compromisos de pago nuevos siguen requiriendo aprobación específica. Los restantes requisitos se resolverán cuando los necesite la acción concreta; no se declara G0 cerrado.

| ID | Estado | Recomendación / decisión necesaria | Cuándo se necesita |
|---|---|---|---|
| O1 Recorrido inicial | Propuesta nueva, pendiente | Empezar la demostración funcional con rent-to-rent de habitaciones y datos ficticios por la experiencia operativa del socio. Mantener agencias y patrimonio propio en V1 y validación; no elegir aún un único segmento comercial. | Antes de preparar tareas funcionales. No supone piloto real autorizado. |
| O2 Control de gasto | Aplazado por el usuario | Tratar 300 € como techo total, incluidos impuestos/cargos; aviso a 240 €, revisión a 270 €. Comprobar coste incremental de cada acción, sin inventario general. | Antes de consumir créditos o contratar. Alertas no equivalen a topes efectivos del proveedor. |
| O3 Reparto provisional | Aplazado; referencias históricas | Reservas orientativas del acta: ChatGPT 125 €, Lovable 40 €, Supabase 45 €, GitHub 10 €, host 25 €, dominio/correo/copias/alertas 15 €, margen 40 €. Total 300 €. | Sustituir reservas por importes brutos reales antes de comprometerlos. No son tarifas ni presupuesto viable demostrado. |
| O4 Responsables | Personas y financiación pendientes | Propuesta: tú producto/aceptación; socio negocio/pago; persona competente para revisión técnica. Acordar quién revisa G1 y los módulos críticos, alcance y coste. | Preparar P09–P12 con responsable de verificación; antes de datos reales, revisión técnica y jurídica pertinente. La IA no acredita revisión independiente. |
| O5 Financiación de revisiones | Pendiente | Obtener presupuesto acotado y decidir si cabe en 300 €, requiere ahorro previo o presupuesto extraordinario aprobado. | Antes de comprometer revisión/fecha de lanzamiento. No asumir honorarios cubiertos por la reserva de herramientas. |
| O6 Alojamiento y proveedores | Pendiente de comprobación | Validar alojamiento en G1 y contratar solo lo necesario. Stripe/correo siguen propuestos; Supabase propio se mantiene. | Host en demostración; correo antes del piloto; cobro/facturación antes de venta. |
| O7 Validación y plazo | Pendiente | Acordar participantes y criterios de piloto posteriormente; medir antes de comprometer capacidad o fecha. | Antes del piloto real y lanzamiento. 12/11/2026 sigue siendo deseo, no entrega garantizada. |

## Cómo decidir y qué queda después

E, C y T ya están aprobados como base inicial; no volver a solicitar esa misma aprobación. Los cambios futuros se registrarán expresamente. O1–O3 son propuestas aprobables; O4–O7 incluyen personas, costes o evidencias que una aprobación genérica no puede dar por comprobados. G0 no se declarará cerrado mientras queden sus decisiones esenciales sin resolver.

Una decisión sobre esta tabla no autoriza P09–P12. Tras registrarla, se preparará el alcance concreto de esa demostración cuando el usuario indique avanzar. No hay aplicación construida ni pruebas ejecutadas por este trabajo.

## Fuentes y límites

- Base documental: especificacion-primera-version-2026-10-19.md (V1.1), blueprint-construccion-v1-2026-10-19.md (V1.0), decisiones-g0-reglas-planes-presupuesto-2026-10-19.md (V1.0), MEMORY.md e instrucciones del usuario de 21/10.
- Los precios del producto son decisiones iniciales aprobadas a partir de propuestas propias; las reservas de gasto siguen propuestas. Ninguno constituye datos de mercado verificados hoy. No se han comprobado facturas o precios actuales de herramientas.
- Consulta oficial 21/10/2026: [Stripe: prorrateos](https://docs.stripe.com/billing/subscriptions/prorations). Los cambios pueden generar ajustes y se pueden previsualizar; el momento de cobro necesita configuración explícita. Apoya comprobar T5, no demuestra que nuestra integración exista.
- [Stripe: modalidades de prueba](https://docs.stripe.com/billing/subscriptions/trials). Su documentación actual distingue mecanismos y restricciones de integración. La modalidad compatible se verificará al implementar; no se promete que toda la política T1–T6 funcione automáticamente al contratar Stripe.

## Registro de revisión

- 21/10/2026, v1.1: aprobación humana expresa de E, C y T como base inicial. Se conserva íntegro su alcance. O permanece pendiente; asignación exacta de informes INF, retención final y verificaciones técnicas/comerciales señaladas en los bloques siguen por resolver. No se han ejecutado pruebas de software.

- 21/10/2026, v1.2: presupuesto económico y O2/O3 aplazados por instrucción humana; prioridad a preparar avances concretos de construcción. E/C/T sin cambios.
