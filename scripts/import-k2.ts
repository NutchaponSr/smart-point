import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as dotenv from "dotenv";
import Papa from "papaparse";

import { normalizeText } from "../convex/lib/employee-id";

dotenv.config({ path: ".env.local" });

/** คอลัมน์รหัสผู้มีสิทธิ์ดู (คอลัมน์ *2 เป็นชื่อ — ไม่ใช้) */
const VIEWER_CODE_COLUMNS = [
  "Manager1",
  "GM-AGM1",
  "VP1",
  "President1",
] as const;

interface K2CsvRow {
  รหัส?: string;
  Manager1?: string;
  "GM-AGM1"?: string;
  VP1?: string;
  President1?: string;
  [key: string]: string | undefined;
}

interface K2ImportRow {
  employeeId: string;
  employees: string[];
}

function parseViewerCodes(row: K2CsvRow): string[] {
  const codes: string[] = [];
  for (const col of VIEWER_CODE_COLUMNS) {
    const raw = row[col]?.trim();
    if (!raw) continue;
    codes.push(normalizeText(raw, 5));
  }
  return [...new Set(codes)];
}

function parseCsv(csvPath: string): K2ImportRow[] {
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const { data, errors } = Papa.parse<K2CsvRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
    transform: (value) => value.trim(),
  });

  if (errors.length > 0) {
    console.error("CSV parse errors:", errors);
    process.exit(1);
  }

  const rows: K2ImportRow[] = [];
  const invalid: { row: number; reason: string }[] = [];

  data.forEach((row, index) => {
    const rawId = row["รหัส"]?.trim();
    if (!rawId) {
      invalid.push({ row: index + 2, reason: "missing รหัส" });
      return;
    }

    rows.push({
      employeeId: normalizeText(rawId, 5),
      employees: parseViewerCodes(row),
    });
  });

  if (invalid.length > 0) {
    console.warn("\nInvalid rows (skipped):");
    for (const item of invalid) {
      console.warn(`  Row ${item.row}: ${item.reason}`);
    }
  }

  return rows;
}

/** Windows cmd ~8191 char limit — keep each `convex run` payload small. */
const CHUNK_SIZE = 40;

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function runBulkUpsert(
  rows: K2ImportRow[],
  prod: boolean,
): { inserted: number; updated: number } {
  // Call Convex CLI via node (not npx.cmd) so Windows keeps JSON quotes intact.
  const argsJson = JSON.stringify({ rows });
  const convexCli = path.join(
    __dirname,
    "..",
    "node_modules",
    "convex",
    "bin",
    "main.js",
  );
  const cliArgs = [
    convexCli,
    "run",
    "k2Workflow:bulkUpsert",
    argsJson,
    ...(prod ? ["--prod"] : []),
  ];
  const output = execFileSync(process.execPath, cliArgs, {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "inherit"],
    shell: false,
    maxBuffer: 32 * 1024 * 1024,
    cwd: path.join(__dirname, ".."),
  });

  const trimmed = output.trim();
  if (!trimmed) {
    return { inserted: 0, updated: 0 };
  }

  try {
    return JSON.parse(trimmed) as { inserted: number; updated: number };
  } catch {
    console.log(trimmed);
    return { inserted: 0, updated: 0 };
  }
}

function parseArgs(): { prod: boolean } {
  return { prod: process.argv.includes("--prod") };
}

function main(): void {
  const { prod } = parseArgs();
  const envLabel = prod ? "PRODUCTION" : "dev";

  const csvPath = path.join(__dirname, "k2.csv");
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV not found: ${csvPath}`);
    process.exit(1);
  }

  const rows = parseCsv(csvPath);
  console.log(`\nTarget: ${envLabel}`);
  console.log(`Parsed ${rows.length} K2 rows from ${csvPath}`);
  console.log("Preview (first 5):");
  for (const row of rows.slice(0, 5)) {
    console.log(
      `  ${row.employeeId} → [${row.employees.join(", ") || "(none)"}]`,
    );
  }

  const chunks = chunkArray(rows, CHUNK_SIZE);
  console.log(
    `\nUpserting ${rows.length} rows in ${chunks.length} chunk(s) via k2Workflow:bulkUpsert${prod ? " --prod" : ""}...\n`,
  );

  let inserted = 0;
  let updated = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]!;
    console.log(`  Chunk ${i + 1}/${chunks.length} (${chunk.length} rows)...`);
    const result = runBulkUpsert(chunk, prod);
    inserted += result.inserted;
    updated += result.updated;
  }

  console.log(`\nDone (${envLabel}). inserted=${inserted}, updated=${updated}`);
}

main();
