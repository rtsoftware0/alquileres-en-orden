# Primer encargo para Claude Code: reproducir y diagnosticar

7 de noviembre de 2026 · Alcance F00 propuesto; utilizar cuando el usuario autorice su ejecución y el repositorio esté disponible en el equipo.

## CONTEXTO

Continuamos REAL ESTATE SOFTWARE en el repositorio privado `rtsoftware0/alquileres-en-orden`. No empieces desde cero. Abre y lee `CLAUDE.md`, `AGENTS.md`, `MEMORY.md`, `Tools Conventions.md`, `docs/project/ESTADO.md`, V1.1, blueprint, tabla G0 y `docs/project/plan-completar-v1-con-claude-code-2026-11-07.md`. Informa de los archivos inaccesibles sin inventar su contenido.

El diseño definitivo no está decidido. La interfaz existente y Verde mediterráneo son referencias provisionales. Supabase propio dev es `tskooksubwunfjirvyjz`; ya está conectado. No crees otro proyecto ni actives Lovable Cloud.

## OBJETIVO

Completar solo F00: reproducir la revisión actual y entregar un diagnóstico que permita preparar F01. Comprueba repositorio, rama y revisión reales, conserva cambios ajenos y no uses el ZIP histórico como fuente actual.

## COMPORTAMIENTO ESPERADO

Instala usando el gestor/lock del repositorio, ejecuta las comprobaciones disponibles de tipos, tests y compilación, y recorre la aplicación local con datos ficticios. Registra resultados reales y qué sucede al recargar. Identifica pruebas excluidas/ausentes y clasifica fallos de producto, preparación de prueba y resultados desconocidos. No reutilices las cifras históricas como resultados actuales. El lock actual sí contiene Supabase; no corregir una ausencia supuesta.

## ALCANCE

Lectura del repositorio completo; instalación y ejecución locales; informe en `docs/project/diagnostico-f00.md` y actualización breve de `MEMORY.md` y `docs/project/ESTADO.md`. Lista comandos y cambios locales necesarios antes de realizarlos. Para una autenticación indispensable, pide únicamente la intervención concreta y continúa lo independiente.

## NO TOCAR

Lógica de negocio, diseño, dependencias/lock para ocultar fallos, historial Git, proyectos remotos, esquema/políticas/datos Supabase y configuración de producción. No regenerar bloque09 ni reabrir arreglos cerrados sin evidencia nueva.

## RESTRICCIONES

Sin backend nuevo, publicación, envíos externos, pagos, compras, datos reales ni cambios de acceso. No mostrar ni guardar secretos. La revisión base del plan era `368ac240b17fe9a2b262b7168652afdd70aab4ce`; puede haber commits documentales posteriores: inspecciona sus diferencias antes de continuar. Si aparecen cambios de código inesperados, informa y ajusta el diagnóstico, sin sobrescribirlos.

## ENTREGA

Versión exacta, archivos modificados, checks ejecutados y resultados, recorrido observado, fallos reproducibles y siguiente alcance recomendado. Relee lo guardado. No empieces F01, no realices arreglos masivos ni declares V1 terminada.
