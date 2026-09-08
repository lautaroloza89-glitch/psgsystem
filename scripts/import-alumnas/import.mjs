// Import inicial de alumnas (parche one-off, no vive en la app).
// Uso:
//   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/import-alumnas/import.mjs           (dry-run)
//   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/import-alumnas/import.mjs --real    (inserta)
//
// Usa la Management API de Supabase (no hay DB password ni service_role key
// disponibles para este proyecto) — requiere un Personal Access Token
// (supabase.com/dashboard/account/tokens), no se guarda en ningún archivo.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.join(__dirname, "data.csv");
const PROJECT_REF = "gbnpebqcobtoegeagmcl";
const MANAGEMENT_API = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

const MAPEO_GRUPO = {
  "escuelita infantil": "Nivel inicial",
  inicial: "Nivel inicial",
  "pre formativa": "Equipo de competencia infantil",
  jungla: "Equipo de competencia (Jungla)",
  avanzado: "Equipo avanzado",
};

const isReal = process.argv.includes("--real");
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error("Falta SUPABASE_ACCESS_TOKEN en el entorno.");
  process.exit(1);
}

function sqlLiteral(value) {
  if (value === null) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function runSql(query) {
  const res = await fetch(MANAGEMENT_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    throw new Error(`Management API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

function parseCsv(raw) {
  const lines = raw.split(/\r?\n/);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const cols = line.split(",");
    // Columnas 5 y 6 (índices 4 y 5) son la copia "limpia" de apellido/nombre,
    // sin los errores de espacios sueltos que tienen las columnas 1 y 2 —
    // confirmado con el usuario, se usan estas en vez de cols[0]/cols[1].
    const apellido = (cols[4] ?? "").trim();
    const nombre = (cols[5] ?? "").trim();
    const grupoOrigen = (cols[2] ?? "").trim();
    if (!apellido && !nombre && !grupoOrigen) continue; // fila separadora entre bloques
    rows.push({ apellido, nombre, grupoOrigen, lineNo: i + 1 });
  }
  return rows;
}

async function main() {
  const raw = readFileSync(CSV_PATH, "utf8");
  const rows = parseCsv(raw);

  console.log(`Modo: ${isReal ? "REAL" : "DRY-RUN"}`);
  console.log(`Filas de datos leídas del CSV: ${rows.length}`);

  const nombresOficiales = [...new Set(Object.values(MAPEO_GRUPO))];
  const grupos = await runSql(
    `select id, nombre from public.grupos where nombre in (${nombresOficiales.map(sqlLiteral).join(", ")})`
  );
  const grupoIdPorNombre = new Map(grupos.map((r) => [r.nombre, r.id]));
  for (const nombre of nombresOficiales) {
    if (!grupoIdPorNombre.has(nombre)) {
      console.error(`ABORTA: no existe el grupo "${nombre}" en la tabla grupos.`);
      process.exit(1);
    }
  }

  const existentes = await runSql(`select apellido, nombre from public.alumnas`);
  const existentesSet = new Set(
    existentes.map((r) => `${r.apellido.trim().toLowerCase()}|${r.nombre.trim().toLowerCase()}`)
  );

  const aInsertar = [];
  const salteadasPorExistir = [];
  const grupoNoReconocido = [];
  const vistosEnEsteCsv = new Set();

  for (const row of rows) {
    const key = `${row.apellido.toLowerCase()}|${row.nombre.toLowerCase()}`;
    const grupoOficial = MAPEO_GRUPO[row.grupoOrigen.toLowerCase()];

    if (!grupoOficial) {
      grupoNoReconocido.push(row);
      continue;
    }
    if (existentesSet.has(key) || vistosEnEsteCsv.has(key)) {
      salteadasPorExistir.push(row);
      continue;
    }
    vistosEnEsteCsv.add(key);
    aInsertar.push({ ...row, grupoOficial, grupoId: grupoIdPorNombre.get(grupoOficial) });
  }

  const porGrupo = new Map();
  for (const r of aInsertar) {
    porGrupo.set(r.grupoOficial, (porGrupo.get(r.grupoOficial) ?? 0) + 1);
  }

  console.log("\n--- Resumen ---");
  console.log(`A insertar: ${aInsertar.length}`);
  for (const [g, c] of porGrupo) console.log(`  ${g}: ${c}`);
  console.log(`Salteadas por ya existir: ${salteadasPorExistir.length}`);
  for (const r of salteadasPorExistir) {
    console.log(`  - ${r.apellido}, ${r.nombre} (línea ${r.lineNo})`);
  }
  console.log(`Grupo no reconocido: ${grupoNoReconocido.length}`);
  for (const r of grupoNoReconocido) {
    console.log(`  - "${r.grupoOrigen}" (línea ${r.lineNo}, ${r.apellido} ${r.nombre})`);
  }

  if (!isReal) {
    console.log("\nDRY-RUN: no se escribió nada en la base. Correr con --real para insertar.");
    return;
  }

  // La Management API rechaza bodies grandes (~10KB) con 413, ver memoria del proyecto.
  const BATCH_SIZE = 25;
  let insertados = 0;
  for (let i = 0; i < aInsertar.length; i += BATCH_SIZE) {
    const batch = aInsertar.slice(i, i + BATCH_SIZE);
    const values = batch
      .map(
        (r) =>
          `(${sqlLiteral(r.apellido)}, ${sqlLiteral(r.nombre)}, NULL, CURRENT_DATE, 'activa', ${sqlLiteral(r.grupoId)})`
      )
      .join(",\n");
    const query = `insert into public.alumnas (apellido, nombre, dni, fecha_inscripcion, estado, grupo_id) values\n${values};`;
    await runSql(query);
    insertados += batch.length;
    console.log(`Batch ${i / BATCH_SIZE + 1}: ${batch.length} filas (total ${insertados}/${aInsertar.length})`);
  }

  console.log(`\nREAL: ${insertados} alumnas insertadas.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
