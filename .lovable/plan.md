# Análisis: confirmación de compartición que reaparece tras revocar y restaurar

## Causa
En `PortalsPage.tsx` (panel de compartición, líneas ~351-383) la vista previa no se descarta: solo se oculta. `previewStamp` guarda una huella `[opción, contacto, revokedGrants, id/versión activa]` y `previewValid = previewStamp === stamp`.
- Al revocar, `revokedGrants` cambia, la huella actual difiere y la vista previa se oculta, pero `previewStamp` conserva el valor antiguo.
- "Restaurar demo" (`restore`, línea 53) devuelve `revokedGrants` al estado previo; la huella recalculada vuelve a coincidir con la guardada y reaparecen la vista previa y "Confirmar compartición".
`PortalShareContext` no interviene: restaura grants sin revivir comparticiones; el fallo es solo estado local de la página.

## Solución mínima (solo `PortalsPage.tsx`)
Descartar la vista previa en cuanto deje de coincidir, en lugar de dejarla latente:
- Añadir un efecto que, si `previewStamp !== null && previewStamp !== stamp`, haga `setPreviewStamp(null)`. Así revocar borra definitivamente la confirmación y restaurar no la recupera; hará falta una nueva "Ver vista previa".
- Mantener la comparación de huella para el render (cubre el instante previo al efecto) y las invalidaciones actuales por selección, versión, compartición y reinicio.
- Sin cambios en autorizaciones, comparticiones, motor ni datos.

Alternativa equivalente: un contador de "época" incrementado en revocar/restaurar incluido en la huella (monotónico, nunca vuelve a coincidir). Se prefiere el efecto por ser más local.

## Regresión (`portals.test.tsx`)
Recorrido UI: Preparar accesos → elegir liquidación aprobada y propietario → Ver vista previa (confirmar visible) → revocar ese acceso → Restaurar demo → afirmar que la vista previa y "Confirmar compartición" están ausentes y no hay compartición activa → nueva vista previa → confirmar visible otra vez.

## Archivos previstos
- `src/features/portals/PortalsPage.tsx`
- `src/features/portals/portals.test.tsx`

Nota: este documento es el único escrito, exigido por el modo plan; no se modificó ningún archivo del proyecto ni se ejecutaron pruebas.
