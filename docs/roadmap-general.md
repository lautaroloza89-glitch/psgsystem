# Roadmap general

> Este documento muestra el plan **por fases**. Para el estado actual de cada módulo, ver la tabla en `PROGRESS.md` — es la que se actualiza sesión a sesión y la única fuente de verdad del estado.

---

## Fase 1 — Base del sistema · cerrada

Todo lo que hace falta para que el equipo trabaje adentro de la app: entrar, ver lo suyo y coordinarse.

- Setup del proyecto (Next.js + TypeScript + Tailwind), deploy en Vercel y proyecto de Supabase.
- Modelo de datos inicial: usuarios, tareas, responsables, comentarios y clases.
- Autenticación por email + password, con roles y RLS por rol.
- Módulo Tareas.
- Módulo Clases/Turnos.
- Dashboard.
- Notificaciones: asignación, comentario y vencimiento, con push a los celulares del equipo.

Después del cierre se sumó una **auditoría (Fase B)** en tres pasadas — frontend, cambios aditivos de base, y decisiones de producto pendientes en la base — más una tanda de trabajo de diseño y UX sobre las pantallas ya construidas.

## Fase 2 — Gestión del club · cerrada

La parte administrativa: quiénes son las alumnas, qué pagan, si vienen y a qué compiten.

**Groundwork** (sin pantallas propias, del que dependen los módulos de abajo): grupos y sus bloques horarios, alumnas y contactos; clases atadas a los grupos por FK real en vez de texto libre; varios profesores por clase.

**Módulos:**

| Módulo | Qué cubre |
|---|---|
| Planificaciones | La planificación de cada clase, por grupo y mes. |
| Alumnas | Listado, ficha, alta/edición y contactos de cada alumna. |
| Pagos y cuotas | Registro de pagos (parciales y por varios métodos), recargo, verificación, recibo, recaudación y deudoras. |
| Asistencia | Toma diaria por grupo y alerta de inasistencias prolongadas. |
| Torneos | Calendario de torneos, exhibiciones y eventos del club. |

Al cerrar la fase se hizo una tanda de **correcciones pre-UI** en cinco bloques (agujeros de permisos, rol Secretaria, unificación del criterio de fecha, campos que faltaban en la base, y el modelo de participación en torneos), pensada como base limpia sobre la que escribir la interfaz nueva.

## Lo que sigue — UI nueva

El próximo tramo grande es el **rediseño de la interfaz**, que se escribe encima de las reglas que dejaron las correcciones pre-UI. Lo primero que le toca:

- Las tres pantallas de participación en torneos (el modelo de datos ya está aplicado).
- La pantalla para reenviar el recibo de un pago (el campo ya está guardado).

**Todavía sin definir** (no entra en ninguna fase hasta que se defina): el control de inscripción paga a torneos, y la gestión de usuarios dentro de la app (hoy las altas y bajas de personal se hacen a mano en Supabase).
