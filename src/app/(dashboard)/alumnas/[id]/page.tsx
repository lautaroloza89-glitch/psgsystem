import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeGestionarAlumnas } from "@/lib/permisos";
import { BackButton } from "@/components/ui/BackButton";
import { AccionesAlumna } from "@/components/alumnas/AccionesAlumna";
import { datosDeFichaAlumna, edadDe } from "@/lib/alumnas/ficha";
import { volverDesdeFicha } from "@/lib/alumnas/origen";
import { mesActualISO } from "@/lib/pagos/reglas";
import { formatMonto } from "@/lib/utils/money";
import { enlaceWhatsapp, primerNombre } from "@/lib/utils/whatsapp";
import { formatFecha, hoyArgentina, nombreMes } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Detalle de alumna" };

/**
 * La ficha.
 *
 * Antes eran seis datos administrativos en dos tarjetas grandes y el teléfono
 * como texto plano — había que memorizarlo y salir a la app de llamadas,
 * aunque el mismo dato en Alertas de asistencia ya fuera un link. Ahora lo
 * primero es **llamar**, que es para lo que se abre esta pantalla; después el
 * estado real de la alumna (vino este mes, debe la cuota); y los datos
 * administrativos bajan a una línea.
 */

const CLASE_FOCO =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

interface ContactoFicha {
  id: string;
  nombre: string;
  telefono: string;
  relacion: string | null;
  es_pagador_principal: boolean;
}

/** «AJ» — la misma inicial en círculo que usa el listado. */
function inicialesDe(apellido: string, nombre: string): string {
  return `${apellido.charAt(0)}${nombre.charAt(0)}`.toUpperCase();
}

/** «desde marzo 2025» — la fecha de inscripción en palabras. */
function desdeCuando(fechaInscripcion: string | null): string | null {
  if (!fechaInscripcion) return null;
  const [anio, mes] = fechaInscripcion.split("-").map(Number);
  return `desde ${nombreMes(mes).toLowerCase()} ${anio}`;
}

function Recuadro({
  titulo,
  valor,
  tono = "normal",
  pie,
}: {
  titulo: string;
  valor: string;
  tono?: "normal" | "bien" | "atencion";
  pie?: string;
}) {
  const color =
    tono === "bien" ? "text-success-700" : tono === "atencion" ? "text-warning-800" : "text-text";

  return (
    <div className="flex-1 rounded-xl border border-border bg-surface p-4">
      <p className="text-sm text-text-subtle">{titulo}</p>
      <p className={`mt-0.5 text-lg font-semibold ${color}`}>{valor}</p>
      {pie && <p className="mt-0.5 text-sm text-text-subtle">{pie}</p>}
    </div>
  );
}

export default async function AlumnaDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  /** De dónde se abrió la ficha: la flecha vuelve ahí (ver `lib/alumnas/origen.ts`). */
  searchParams: Promise<{ from?: string; mes?: string }>;
}) {
  const { id } = await params;
  const { from, mes } = await searchParams;
  const profile = await getCurrentUserProfile();

  if (!puedeGestionarAlumnas(profile)) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  const { data: alumna } = await supabase
    .from("alumnas")
    .select(
      "id, apellido, nombre, dni, fecha_nacimiento, fecha_inscripcion, fecha_baja, estado, grupo:grupos(nombre)"
    )
    .eq("id", id)
    .single();

  if (!alumna) {
    notFound();
  }

  const mesISO = mesActualISO();
  const hoy = hoyArgentina();

  const [{ data: contactosData }, datos] = await Promise.all([
    supabase
      .from("contactos")
      .select("id, nombre, telefono, relacion, es_pagador_principal")
      .eq("alumna_id", id)
      .order("es_pagador_principal", { ascending: false })
      .order("nombre"),
    datosDeFichaAlumna(supabase, id, mesISO),
  ]);

  const contactos = (contactosData ?? []) as ContactoFicha[];
  const principal = contactos.find((c) => c.es_pagador_principal) ?? contactos[0] ?? null;
  const grupoNombre = (alumna.grupo as unknown as { nombre: string } | null)?.nombre ?? "Sin grupo";
  const deBaja = alumna.estado !== "activa";
  const edad = edadDe(alumna.fecha_nacimiento);
  const mesNombre = nombreMes(Number(mesISO.slice(5, 7))).toLowerCase();

  const waPrincipal = principal ? enlaceWhatsapp(principal.telefono) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <BackButton href={volverDesdeFicha(alumna.id, from, mes)} />

      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-muted text-sm font-semibold text-text-subtle"
        >
          {inicialesDe(alumna.apellido, alumna.nombre)}
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight tracking-tight">
            {alumna.apellido}, {alumna.nombre}
          </h1>
          <p className="text-sm text-text-subtle">
            {grupoNombre}
            {desdeCuando(alumna.fecha_inscripcion) && ` · ${desdeCuando(alumna.fecha_inscripcion)}`}
          </p>
        </div>
      </div>

      {/* El badge «Activa» se fue: era ruido en el 90% de las fichas. Si está
          de baja, la ficha lo dice en grande — que es la excepción. */}
      {deBaja && (
        <div className="rounded-xl border border-border-strong bg-surface-muted px-4 py-3">
          <p className="text-sm font-medium">
            De baja{alumna.fecha_baja && ` desde el ${formatFecha(alumna.fecha_baja)}`}
          </p>
          <p className="mt-0.5 text-sm text-text-subtle">
            {alumna.fecha_baja
              ? "Se le cobró la cuota hasta ese mes inclusive."
              : "Sin fecha de baja cargada, así que no genera cuota de ningún mes."}
          </p>
        </div>
      )}

      {/* Lo primero es llamar: es para lo que se abre esta pantalla. */}
      {principal ? (
        <div className="flex flex-wrap gap-2">
          <a
            href={`tel:${principal.telefono.replace(/\s/g, "")}`}
            className={`flex-1 rounded-lg bg-primary-500 px-4 py-3 text-center text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 ${CLASE_FOCO}`}
          >
            Llamar a {primerNombre(principal.nombre)}
          </a>
          {waPrincipal && (
            <a
              href={waPrincipal}
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-lg border border-border px-4 py-3 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard hover:border-border-strong ${CLASE_FOCO}`}
            >
              WhatsApp
            </a>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
          <span className="text-sm text-text-subtle">Sin contacto cargado</span>
          <Link
            href={`/alumnas/${alumna.id}/editar`}
            className={`rounded-lg border border-border px-4 py-2 text-sm font-medium text-primary-600 transition-colors duration-[var(--duration-fast)] ease-standard hover:border-border-strong ${CLASE_FOCO}`}
          >
            Agregar
          </Link>
        </div>
      )}

      {datos.semanasSinVenir !== null && (
        <Link
          href="/asistencia/alertas"
          className={`block rounded-xl border border-error-200 bg-error-50 px-4 py-3 transition-colors duration-[var(--duration-fast)] ease-standard hover:border-error-300 ${CLASE_FOCO}`}
        >
          <p className="text-sm font-medium text-error-800">
            {datos.semanasSinVenir} semanas sin venir
          </p>
          {datos.ultimaPresencia && (
            <p className="mt-0.5 text-sm text-error-800/80">
              Última vez el {formatFecha(datos.ultimaPresencia)}
            </p>
          )}
        </Link>
      )}

      {/* Las dos preguntas que el sistema ya podía responder y la ficha no
          contestaba: ¿vino este mes? ¿está al día? */}
      <div className="flex gap-3">
        <Recuadro
          titulo={`Asistencia de ${mesNombre}`}
          valor={
            datos.asistencia.marcadas === 0
              ? "Sin datos"
              : `${datos.asistencia.presentes} de ${datos.asistencia.marcadas}`
          }
          pie={datos.asistencia.marcadas === 0 ? "Todavía no se le tomó asistencia" : undefined}
        />

        {datos.saldo ? (
          <Recuadro
            titulo={`Cuota de ${mesNombre}`}
            valor={datos.saldo.saldoSinRecargo <= 0 ? "Paga" : formatMonto(datos.saldo.saldoSinRecargo)}
            tono={datos.saldo.saldoSinRecargo <= 0 ? "bien" : "atencion"}
            pie={
              datos.saldo.saldoSinRecargo > 0 && datos.saldo.montoPagadoVerificado > 0
                ? `Pagó ${formatMonto(datos.saldo.montoPagadoVerificado)}`
                : undefined
            }
          />
        ) : (
          <Recuadro titulo={`Cuota de ${mesNombre}`} valor="Sin grupo" pie="Sin grupo no hay cuota" />
        )}
      </div>

      <section aria-labelledby="contactos-titulo" className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="contactos-titulo" className="text-base font-semibold">
            Contactos
          </h2>
          <Link
            href={`/alumnas/${alumna.id}/editar`}
            className={`rounded text-sm font-medium text-primary-600 hover:text-primary-700 ${CLASE_FOCO}`}
          >
            + Otro contacto
          </Link>
        </div>

        {contactos.length === 0 ? (
          <p className="text-sm text-text-subtle">Todavía no hay contactos cargados.</p>
        ) : (
          <ul className="overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border">
            {contactos.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0">
                  <span className="block font-medium leading-snug">{c.nombre}</span>
                  <span className="block text-sm text-text-subtle">
                    {/* El badge «Pagador principal» pasa a leerse como una
                        frase: «Madre · paga la cuota». */}
                    {[c.relacion, c.es_pagador_principal ? "paga la cuota" : null]
                      .filter(Boolean)
                      .join(" · ") || c.telefono}
                  </span>
                </span>
                <a
                  href={`tel:${c.telefono.replace(/\s/g, "")}`}
                  aria-label={`Llamar a ${c.nombre}`}
                  className={`shrink-0 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard hover:border-border-strong ${CLASE_FOCO}`}
                >
                  Llamar
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Los datos administrativos, que eran lo único que había: ahora una
          línea al pie, donde también se entra a editarlos. */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm text-text-subtle">
          {alumna.dni ? `DNI ${alumna.dni}` : "Sin DNI"}
          {edad !== null && ` · ${edad} años`}
          {alumna.fecha_inscripcion && ` · inscripta el ${formatFecha(alumna.fecha_inscripcion)}`}
        </p>
        <Link
          href={`/alumnas/${alumna.id}/editar`}
          className={`rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard hover:border-border-strong ${CLASE_FOCO}`}
        >
          Editar datos
        </Link>
      </div>

      <AccionesAlumna
        alumnaId={alumna.id}
        alumnaNombre={alumna.nombre}
        deBaja={deBaja}
        fechaBaja={alumna.fecha_baja}
        hoy={hoy}
      />
    </div>
  );
}
