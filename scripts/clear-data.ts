import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

const PRESERVE_TABLES = new Set(["migration_run", "migration_state"]);
const EMPTY_FILE = path.join(__dirname, "empty.jsonl");
const CONFIRM_TOKEN = "CLEAR_ALL_DATA";

function run(command: string): string {
  return execSync(command, {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "inherit"],
  });
}

function getTables(prod: boolean): string[] {
  const prodFlag = prod ? " --prod" : "";
  const output = run(`npx convex data${prodFlag}`);
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function clearTable(table: string, prod: boolean): void {
  const prodFlag = prod ? " --prod" : "";
  const quotedPath = JSON.stringify(EMPTY_FILE);
  execSync(
    `npx convex import --table ${table} --replace -y --format jsonLines ${quotedPath}${prodFlag}`,
    { stdio: "inherit" },
  );
}

function parseArgs(): { prod: boolean; confirmed: boolean } {
  const args = process.argv.slice(2);
  const prod = args.includes("--prod");
  const confirmIndex = args.indexOf("--confirm");
  const confirmed =
    confirmIndex !== -1 && args[confirmIndex + 1] === CONFIRM_TOKEN;

  return { prod, confirmed };
}

function main(): void {
  const { prod, confirmed } = parseArgs();

  if (!confirmed) {
    console.error(
      `Usage: tsx scripts/clear-data.ts [--prod] --confirm ${CONFIRM_TOKEN}`,
    );
    console.error(
      "\nThis deletes all documents from every table except migration_run and migration_state.",
    );
    process.exit(1);
  }

  if (!fs.existsSync(EMPTY_FILE)) {
    fs.writeFileSync(EMPTY_FILE, "");
  }

  const env = prod ? "production" : "dev";
  const tables = getTables(prod).filter((table) => !PRESERVE_TABLES.has(table));

  console.log(`\nClearing ${tables.length} tables on ${env}...\n`);

  for (const table of tables) {
    console.log(`  → ${table}`);
    clearTable(table, prod);
  }

  console.log(`\nDone. Preserved: ${[...PRESERVE_TABLES].join(", ")}`);
  console.log(
    "Note: files in Convex storage (_storage) are not removed by this script.",
  );
}

main();
