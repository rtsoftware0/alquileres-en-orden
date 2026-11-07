# Traspaso principal a Claude y Claude Code

7 de noviembre de 2026 · Decisión de continuidad confirmada; ejecución técnica pendiente.

## Qué cambia

El usuario quiere mejorar, completar y continuar el proyecto en Claude, con Claude Code y herramientas independientes. Claude pasa a ser el entorno principal de trabajo. Lovable queda como origen del prototipo y referencia histórica; no hay que terminar V1 allí ni depender de su editor para desarrollar, comprobar o publicar.

La aplicación conserva su repositorio privado [rtsoftware0/alquileres-en-orden](https://github.com/rtsoftware0/alquileres-en-orden) y su Supabase propio `real-estate-dev`, referencia `tskooksubwunfjirvyjz`. No se han creado otros destinos ni desconectado el enlace existente. Claude es la herramienta de desarrollo, no el alojamiento de la web ni el propietario de los datos.

La estructura del código se podrá mejorar mediante tareas justificadas y verificadas. No es obligatorio conservar decisiones deficientes del prototipo. Tampoco se deduce de este traslado que haya que cambiar todo el framework o desechar la lógica útil. El diseño final de la aplicación sigue pendiente de elección.

## Cómo empezar sin escribir código

1. Usar Claude Code con una cuenta que tenga acceso a esa función. La opción recomendada es Claude Desktop, pestaña **Code**, trabajando sobre una carpeta local; comprobar la disponibilidad real en la cuenta. [Inicio oficial](https://code.claude.com/docs/en/desktop-quickstart).
2. Obtener un clon completo del repositorio privado y abrir esa carpeta en Claude Code. El acceso del conector usado en este chat no da por autenticado Git en el ordenador. Si todavía no hay clon, Claude puede guiar su preparación; la autenticación personal se completa en el flujo oficial, sin pegar credenciales en conversaciones.
3. Darle el [primer encargo preparado](arranque-claude-code-2026-11-07.md). Informa de que quieres continuar allí el proyecto. No hace falta copiar todo el chat: las decisiones y el plan están en los archivos.
4. Pedir que compruebe lo que puede leer y ejecutar: repositorio/revisión, instrucciones, comandos del proyecto y acceso concreto a Supabase de desarrollo cuando se necesite. Las conexiones no se heredan automáticamente. [Conexiones MCP](https://code.claude.com/docs/en/mcp).
5. Revisar su diagnóstico y aprobar el alcance concreto de independencia técnica antes de modificar la aplicación. Después, continuar las fases del [plan V1.1](plan-completar-v1-con-claude-code-2026-11-07.md) dentro de Claude, guardando avances en el repositorio.

## Herramientas y responsabilidades

| Herramienta | Función |
|---|---|
| Claude y Claude Code | Conversación de producto, diseño, desarrollo, reorganización, pruebas y mantenimiento; decisiones guardadas en el repositorio |
| GitHub existente | Código, documentación e historial; ramas y revisión de cambios; automatización de comprobaciones por configurar |
| Supabase propio existente | Datos, usuarios y archivos privados. Backend de negocio todavía por construir |
| Navegador local y herramientas de prueba | Ver y comprobar la aplicación sin el editor Lovable; Playwright es una propuesta para automatizar recorridos |
| Alojamiento independiente | Ejecutar la web de prueba/producción; proveedor y configuración por elegir según TanStack Start |
| Correo y cobro de nuestra cuota | Proveedores por seleccionar al llegar a esas fases; Stripe continúa como candidato, no decisión |
| Lovable | Referencia histórica; no usar su agente ni sus créditos para nuevos cambios por defecto |

No se recomienda incorporar muchas herramientas a la vez. Primero Claude Code, GitHub, ejecución local y Supabase dev; después alojamiento, automatización, correo y pagos según las necesidades reales de cada fase.

## Dependencias que debe resolver Claude

Revisión de código inspeccionada: `80c61c74444943aaf128ae9a60be306a71afdec0`.

- `package.json` y `vite.config.ts` utilizan `@lovable.dev/vite-tanstack-config@2.26.5`. El lock apunta a un registro de distribución de Lovable. Falta comprobar una instalación limpia; esto es una dependencia encontrada, no prueba de que sea imposible instalarla.
- `src/lib/lovable-error-reporting.ts` y su llamada desde la ruta raíz contienen hooks del editor. Revisar su retirada o sustitución por observabilidad independiente.
- El wrapper agrupa configuración importante. Su sustitución debe conservar TanStack Start/React, SSR, rutas, alias, Tailwind y protección CSRF de `src/start.ts`. No duplicar plugins mientras siga activo ni convertir la app en una web estática por suposición.
- Preservar Supabase propio y trasladar las verificaciones a un entorno independiente. Verificar compilación y funcionamiento antes de seleccionar alojamiento definitivo.

Claude presentará la propuesta concreta de cambios tras el diagnóstico, con los archivos afectados y comprobaciones. Las reglas que describen datos/formularios temporales del prototipo no prohíben construir persistencia en las fases autorizadas; sí describen el comportamiento que debe preservarse mientras siga existiendo ese modo de demostración.

## Cuándo estará completo el traspaso

- Claude puede leer el código, requisitos, decisiones, pendientes y pruebas diseñadas desde el repositorio actual.
- La aplicación instala, arranca, compila y se comprueba sin una sesión del editor Lovable; dependencias de su infraestructura retiradas o justificadas explícitamente.
- Claude puede guardar cambios autorizados en GitHub y releerlos; los accesos concretos a Supabase dev están comprobados sin exponer secretos.
- Existe una vista previa independiente, resultados de pruebas actuales y un procedimiento de desarrollo documentado.
- El trabajo puede continuar sin este chat. La salida a producción y los módulos de V1 pendientes conservan sus propios criterios de aceptación.

Mantener Git sync conectado permite que los cambios de su rama sigan apareciendo en Lovable y deja posible una edición accidental allí. Durante el traslado, trabajar solo desde Claude sobre ramas revisables. Desconectar el enlace, cancelar Lovable o borrar recursos requiere una acción específica posterior; no son condiciones para preparar este traspaso ni se han ejecutado.

## Qué se entrega ahora y qué no está ejecutado

Plan actualizado, este documento y primer encargo; instrucciones y memoria orientadas a Claude. Se conserva V1.1 y las decisiones E/C/T aprobadas, con diseño final abierto. No se ha instalado ni autenticado Claude, completado un clon local, eliminado dependencias, ejecutado pruebas actuales, configurado proveedores nuevos ni migrado datos. El primer paso técnico es T1/F00, diagnóstico y reproducción en Claude Code.
