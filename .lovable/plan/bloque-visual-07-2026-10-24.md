# Bloque visual 07

## Resultado
- Calendario con filtros de vivienda/unidad y mes o rango, intervalos navegables y disponibilidad histórica/futura.
- Solicitudes de candidatos existentes, seguimiento temporal y conversión a borrador sin duplicados.
- Reservas con preparación, revisión, confirmación, cancelación y caducidad exclusivamente simuladas.
- Cambios hipotéticos desde contratos activos: renta, traslado, prórroga y salida anticipada, con antes/después.

## Límites
Sin backend, conexiones, almacenamiento persistente, envíos, archivos, pagos ni publicación. Conservar íntegro el escenario anterior. Reiniciar o recargar elimina todo el escenario temporal; navegar entre sus pantallas lo conserva. No se certifican A03/A04/A13/A14 ni P29–P32 operativos.

## Detalles técnicos
- Módulo aislado `src/features/planning/`, rutas delgadas y contexto React compartido para la sesión temporal.
- Metadatos locales por ID: solicitudes para con-013/con-014, reserva vinculada a CT-EJ-0106 y mantenimiento abierto de AZA-06. Sin contactos ni contratos base nuevos.
- Un único motor civil UTC para intervalos [entrada,salida), conflictos por habitación/vivienda completa y prorrateo exacto en céntimos; reutilizar validadores existentes.
- Conversión de solicitudes relacionadas abre 0105/0106; una solicitud diferenciada puede producir un único borrador temporal adaptable mediante condiciones del asistente existente.
- Los cambios contractuales se revisan sin crear cargos, alterar historial real ni liquidar fianzas.

## Verificación
Pruebas de límites, fechas, conflictos, transiciones, idempotencia y escenario base; pruebas existentes y comprobaciones automáticas de tipos/compilación. Navegador a 1440×900 y 390×844 para todos los recorridos nuevos, foco/Tab, errores, reinicio, enlaces y ausencia de desbordamiento. Capturas inspeccionadas de calendario y cambio contractual.