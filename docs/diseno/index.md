# PSG · Modelos visuales de la UI nueva

Cada archivo de esta carpeta es un **modelo visual autocontenido**: se abre en el navegador y funciona offline.

## Cómo usarlos

- Son **referencia visual, no implementación**. El markup interno no se copia al repo: está escrito con otra tecnología y no corresponde a la estructura de Next.js del proyecto. Lo que se lee del modelo es el layout, la jerarquía, la densidad, los estados y el texto en pantalla.
- Cada modelo trae el **inventario** de a dónde va cada elemento de la pantalla actual, adentro del propio archivo.
- Si el modelo y un `.md` se contradicen en algo de **diseño**, manda el modelo. Si se contradicen en algo de **datos, permisos o reglas**, manda el `.md`.

## Qué se comiteó y qué no

Los modelos se exportaron del canvas de Claude Design como HTML *bundleados*: 4,85 MB cada uno, de los cuales 4,37 MB son el runtime del canvas (JS comprimido en base64, en una sola línea de 4,5 millones de caracteres). Los 8 sumaban 38 MB de runtime casi todo duplicado, y esa línea gigante vuelve el archivo indiffeable — cualquier retoque futuro se vería como "una línea cambió".

Lo comiteado son los **documentos de diseño extraídos** de esos bundles (`.dc.html`, 218–267 KB cada uno, 1,9 MB en total): el mismo contenido —markup, tokens del design system «Nocturne», textos e inventario—, legible y diffeable. Los bundles originales quedan fuera del repo, en el disco de Lauti; el `.zip` está en `.gitignore`.

## Orden de trabajo

El número del archivo es el orden de aplicación definido en `02-copia-y-nueva-ui.md` (sección «Orden de aplicación de la UI nueva»). Un módulo por sesión, un commit por módulo. Al terminar cada uno, probarlo con al menos dos roles distintos: uno de gestión y uno del personal.

| # | Archivo | Módulo |
| --- | --- | --- |
| 1 | `01-inicio-navegacion.dc.html` | Navegación e Inicio |
| 2 | `02-miembros.dc.html` | Miembros |
| 3 | `03-tareas.dc.html` | Tareas |
| 4 | `04-asistencia.dc.html` | Asistencia |
| 5 | `05-pagos.dc.html` | Pagos |
| 6 | `06-alumnas.dc.html` | Alumnas |
| 7 | `07-planificaciones.dc.html` | Planificaciones |
| 8 | `08-torneos.dc.html` | Torneos + Participación |

> El `index.md` original apuntaba a un tercer documento (`03-cierre-por-modulo.md`) con un «Semáforo de arranque de UI» y una numeración de secciones propia. **Ese documento quedó fuera del alcance** y no se consulta: la única fuente de orden y de reglas es `02-copia-y-nueva-ui.md` más el modelo visual de cada módulo. Se sacaron de acá la sección que lo exigía y la columna que traducía las numeraciones.

`08-torneos.dc.html` incluye las dos pantallas de participación en torneos (modelos Tg y Th), que **no existen hoy** en la app: dependen de `torneo_participantes` y de `alumnas.fecha_nacimiento`. Van últimas — y ojo, `fecha_nacimiento` está hoy vacía en las 158 alumnas (ver `docs/pendientes.md`).
