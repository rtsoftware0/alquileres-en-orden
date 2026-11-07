# Tools Conventions

REAL ESTATE SOFTWARE | Versión 1.1 | 2 de noviembre de 2026

## Alcance y autoridad

Convenciones locales de este proyecto, creadas por instrucción expresa del usuario el 21/10/2026: «Crea un Tools Conventions.md propio y saltate el inventario de identidades etc.».

Este archivo sustituye para este proyecto la dependencia del archivo compartido de la cuenta anterior. No es una copia de aquel archivo, cuyo contenido no se ha podido leer en esta sesión, ni establece preferencias universales para otros proyectos. Las instrucciones actuales del usuario prevalecen sobre estas convenciones; se mantienen los permisos de la plataforma y las reglas de AGENTS.md.

## Uso de herramientas

- Omitir el inventario general previo de identidades, cuentas, roles, facturación y recuperación. No convertirlo en requisito para continuar ni volver a solicitarlo bajo otro nombre.
- Comprobar solo la disponibilidad, el destino y los permisos necesarios para la acción concreta que se vaya a realizar. No dar por verificado un dato desconocido ni asumir que una conexión se trasladó desde otra cuenta.
- No usar como destino el antiguo espacio personal Feezy's Lovable. La aparición de otro espacio no autoriza por sí sola crear activos en él.
- Usar ChatGPT Pro/Work, Lovable, Supabase propio y GitHub conforme al alcance acordado. No activar Lovable Cloud como sustituto de Supabase propio sin decisión expresa.
- Preferir las herramientas conectadas disponibles que permitan completar la acción; declarar las limitaciones reales cuando falte una capacidad.

## Autorización y ejecución

- Antes de avanzar en construcción, consultar la especificación V1.1 y el blueprint, presentar la acción concreta y esperar aprobación. Una aprobación cubre todo su alcance: completarlo y verificarlo sin repetir la misma solicitud.
- No avanzar automáticamente al paso siguiente. Compras, publicación, borrados y cambios de acceso requieren aprobación específica.
- Por instrucción del 21/10/2026, dejar en segundo plano el presupuesto económico anterior de 300 € y no usarlo como requisito para preparar avances. Trabajar con la referencia comunicada de Lovable Pro y 400 créditos mensuales. Los precios comerciales E/C/T siguen aprobados. Nuevas compras o recargas requieren aprobación específica; posponer el presupuesto no autoriza gasto ilimitado.
- No tratar la operación de 150 habitaciones del socio como autorización de acceso a datos de inquilinos. Utilizar datos ficticios en desarrollo conforme a la especificación.
- No guardar contraseñas, códigos de acceso, claves API ni secretos en chats, documentación o repositorios.

## Archivos, evidencia y continuidad

- Usar la carpeta local realmente accesible; resolver las referencias relativas desde la raíz actual del proyecto. No asumir que existen las rutas antiguas del ordenador de origen.
- Mantener AGENTS.md, MEMORY.md y este archivo en la raíz; intermediarios en work/ y entregables en outputs/. Los Markdown son la referencia documental y los Word son copias de revisión.
- Separar decisiones confirmadas, propuestas, acciones realizadas y elementos pendientes. Una prueba diseñada no es una prueba ejecutada o superada.
- Verificar el contenido guardado y el resultado de las acciones externas. Registrar progreso y decisiones confirmadas en MEMORY.md, sin datos sensibles innecesarios.
- Comunicar en español y explicar las acciones en lenguaje comprensible, sin exigir al usuario que escriba código.

## Lovable (vía plugin)

Principio: un cambio solo existe si queda guardado y puedo releerlo. Lo que diga el chat de Lovable no es prueba.

### Antes de actuar
- Lee el estado real (archivos, revisión actual) con el plugin. No trabajes de memoria ni de resúmenes.
- Confirma proyecto y revisión base. Si no coinciden con lo esperado, para y avisa.

### Cómo pedir o aplicar cambios
- Un objetivo por operación. Tareas grandes en tandas (lógica, vistas, tests).
- Estructura: CONTEXTO, OBJETIVO, COMPORTAMIENTO ESPERADO (comprobable a mano), ALCANCE (rutas exactas), NO TOCAR, RESTRICCIONES.
- Funciones complejas: primero una operación de análisis/plan sin cambios, luego otra de ejecución.
- Sin excepciones abiertas ("salvo si es imprescindible"). Los límites son exactos.
- Código siempre en bloques de código. Antes de guardar, revisa que no falten símbolos (*, /** */, operadores) y compara bytes/hash con el manifest si existe.
- Backend (Supabase, auth, pagos), publicación y compras o recargas de créditos: solo si lo pido expresamente y en operaciones separadas. Avísame del coste en créditos antes de operaciones largas.

### Después de guardar
- Relee cada archivo modificado y compara bytes/hash. Confirma que hay una revisión nueva.
- No declares tests, typecheck ni build como pasados salvo que una herramienta los haya ejecutado y puedas mostrar el resultado. Si no, déjalos "pendientes de verificación local".
- Si no se pudo guardar o falla una verificación, informa de lo observado y registra el pendiente, distinguiendo un fallo de la aplicación de una prueba mal preparada o un resultado aún desconocido. No declares verificado lo que no lo esté. No detengas todo el proyecto automáticamente: continúa las tareas independientes dentro del alcance ya aprobado. Detén solo la parte afectada y sus dependencias cuando no pueda confirmarse su guardado o continuar pueda agravar el fallo. Nunca inventes hashes, revisiones ni commits, ni hagas commits vacíos.
- Si un arreglo falla dos veces, detén ese arreglo, registra lo intentado y explica la causa conocida. Continúa las tareas independientes ya aprobadas; no repitas ese arreglo automáticamente.

### Formato de respuesta final
Archivos modificados · revisión anterior y nueva · resultado de la relectura · qué queda sin verificar.
### Método de prompting (cuando la instrucción va al agente de Lovable)

Elegir la vía:
- Si conozco el contenido exacto del cambio (archivos ya escritos): edición directa, no prompt.
- Si hay que decidir cómo implementarlo: prompt al agente, con el método de abajo.

Estructura obligatoria, en este orden:
1. CONTEXTO: qué proyecto es y qué ya funciona.
2. OBJETIVO: qué construir y por qué, en 1-3 frases.
3. COMPORTAMIENTO ESPERADO: criterios que pueda comprobar a mano en la vista previa.
4. ALCANCE: rutas o archivos exactos a crear o modificar.
5. NO TOCAR: archivos, módulos, dependencias y datos que deben quedar iguales.
6. RESTRICCIONES: sin backend/publicación/compras salvo petición; datos ficticios; estilo.

Reglas:
- Un objetivo por prompt. Si hay varias partes, prompts numerados y secuenciales.
- Funciones complejas: dos pasos. Primero un prompt de análisis/plan que no modifique código; revisarlo; después uno de ejecución.
- Para fallos: pedir primero que investigue y explique la causa, y luego que corrija cuando corresponda dentro del alcance autorizado. Tras dos intentos fallidos, detener ese arreglo y continuar las tareas independientes ya aprobadas.
- Reutilizar plantillas ya probadas para patrones repetidos (tabla, formulario, filtros) en vez de redactar de cero.
- Contexto estable (producto, roles, reglas de diseño) va en el Knowledge file del proyecto, no se repite en cada prompt.
- Mantener el prompt corto y concreto: lo que no afecta a esta tarea se quita.
- No pedir a Lovable que ejecute ni certifique tests/build; pedirle solo qué archivos cambió. La comprobación la hago releyendo los archivos.
