import { ConvexHttpClient } from "convex/browser";
import * as fs from "fs";
import * as path from "path";
import Papa from "papaparse";
import * as dotenv from "dotenv";
import { api } from "../convex/functions/_generated/api";
import { normalizeEmployeeId } from "../convex/lib/employee-id";

interface EmployeeCSVRow {
  employeeId: string;
  name: string;
  email?: string;
  department: string;
  position: string;
  rank: string;
  division: string;
  password: string;
}

interface EmployeeSeedInput {
  employeeId: string;
  name: string;
  email?: string;
  department: string;
  position: string;
  rank: string;
  division: string;
  password: string;
}

interface SeedResult {
  created: number;
  skipped: number;
}

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function normalizePassword(password: string): string {
  return password.padStart(5, "0");
}

function validateRow(
  row: EmployeeCSVRow,
  index: number
): { valid: boolean; reason?: string } {
  if (!row.employeeId) return { valid: false, reason: "missing employeeId" };
  if (!row.name) return { valid: false, reason: "missing name" };
  if (!row.department) return { valid: false, reason: "missing department" };
  if (!row.password) return { valid: false, reason: "missing password" };
  return { valid: true };
}

async function main() {
  const csvPath = path.join(__dirname, "employee.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8");

  const { data, errors } = Papa.parse<EmployeeCSVRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
    transform: (value) => value.trim(),
  });

  if (errors.length > 0) {
    console.error("CSV parse errors:", errors);
    process.exit(1);
  }

  const employees: EmployeeSeedInput[] = [];
  const invalidRows: { row: number; reason: string }[] = [];

  data.forEach((row, index) => {
    const { valid, reason } = validateRow(row, index);

    if (!valid) {
      invalidRows.push({ row: index + 2, reason: reason! }); // +2 เพราะ header คือ row 1
      return;
    }

    employees.push({
      employeeId: normalizeEmployeeId(row.employeeId),
      name: row.name,
      email: row.email || undefined,         // ✅ ว่าง → undefined
      department: row.department,
      position: row.position,
      rank: row.rank,
      division: row.division,
      password: normalizePassword(row.password),
    });
  });

  // แสดง invalid rows
  if (invalidRows.length > 0) {
    console.warn("\n⚠️  Invalid rows (will be skipped):");
    invalidRows.forEach(({ row, reason }) => {
      console.warn(`  Row ${row}: ${reason}`);
    });
  }

  // preview
  console.log("\n📋 Preview:");
  employees.forEach((emp) => {
    const emailDisplay = emp.email ?? "(no email)";
    console.log(
      `  ${emp.employeeId.padEnd(10)} | ${emp.name.padEnd(20)} | ${emailDisplay.padEnd(30)} | password: ${emp.password}`
    );
  });

  console.log(`\n🚀 Seeding ${employees.length} employees...\n`);

  const result = (await client.action(api.seed.seedEmployee, {
    employees,
  })) as SeedResult;

  console.log(`\n✅ Seed complete: ${result.created} created, ${result.skipped} skipped`);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});