import * as XLSX from "xlsx";

import { 
  z, 
  type ZodError, 
  type ZodObject, 
  type ZodRawShape, 
  type ZodType 
} from "zod";

import { ExcelRow, ExportOptions, FieldConfig, ImportOptions, ValidationError, ValidationResult } from "@/types/excel";

export function buildDynamicSchema<T extends Record<string, FieldConfig>>(
  fields: T
): ZodObject<{ [K in keyof T]: ZodType }> {
  const shape: Record<string, ZodType> = {};

  for (const [key, config] of Object.entries(fields)) {
    let fieldSchema: ZodType;

    switch (config.type) {
      case "string":
        fieldSchema = z.string();
        
        if (config.min !== undefined) {
          fieldSchema = (fieldSchema as z.ZodString).min(
            config.min,
            config.customMessage ?? `Minimun ${config.min} characters`,
          );
        }

        if (config.max !== undefined) {
          fieldSchema = (fieldSchema as z.ZodString).max(
            config.max,
            config.customMessage ?? `Maximum ${config.max} characters`,
          );
        }

        if (config.regex) {
          fieldSchema = (fieldSchema as z.ZodString).regex(
            config.regex,
            config.customMessage ?? "Invalid format",
          );
        }

        break;
      case "number":
        fieldSchema = z.coerce.number();

        if (config.min !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).min(
            config.min,
            config.customMessage ?? `Minimum value is ${config.min}`,
          );
        }

        if (config.max !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).max(
            config.max,
            config.customMessage ?? `Maximum value is ${config.max}`,
          );
        }

        break;
      case "boolean":
        fieldSchema = z.coerce.boolean();
        break;
      case "date":
        fieldSchema = z.coerce.date();
        break;
      case "email":
        fieldSchema = z.string().email(config.customMessage ?? "Invalid email");
        break;
      case "url":
        fieldSchema = z.string().url(config.customMessage ?? "Invalid URL");
        break;
      case "enum":
        if (!config.enumValues || config.enumValues.length === 0) {
          throw new Error(`Enum field "${key}" must have enumValues defined`);
        }

        fieldSchema = z.enum(config.enumValues as [string, ...string[]]);
        break;
      default:
        fieldSchema = z.unknown();
    }

    if (!config.required) {
      fieldSchema = fieldSchema.optional().nullable();
    }

    shape[key] = fieldSchema;
  }

  return z.object(shape) as ZodObject<{ [K in keyof T]: ZodType }>;
}

export function exportToExcel<T extends ExcelRow>(
  data: T[],
  options: ExportOptions = {}
): void {
  const {
    sheetName = "Sheet1",
    filename = "export",
    headers
  } = options;

  const exportData = headers
    ? data.map((row) => {
      const transformedRow: ExcelRow = {};

      for (const [key, value] of Object.entries(row)) {
        const header = headers[key] ?? key;
        transformedRow[header] = value;
      }

      return transformedRow;
    })
    : data;
  
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // AUTO SIZE COLUMNS
  const maxWidths: number[] = [];
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");

  for (let col = range.s.c; col <= range.e.c; col++) {
    let maxWidth = 10;

    for (let row = range.s.r; row <= range.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];

      if (cell && cell.v) {
        const cellLength = String(cell.v).length;
        maxWidth = Math.max(maxWidth, cellLength);
      }
    }

    maxWidths.push(Math.min(maxWidth + 2, 50));
  }

  worksheet["!cols"] = maxWidths.map((width) => ({ wch: width }));

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToExcelBuffer<T extends ExcelRow>(
  data: T[],
  options: ExportOptions = {}
): Buffer {
  const {
    sheetName = "Sheet1",
    headers
  } = options;

  const exportData = headers
    ? data.map((row) => {
      const transformedRow: ExcelRow = {};

      for (const [key, value] of Object.entries(row)) {
        const header = headers[key] ?? key;
        transformedRow[header] = value;
      }

      return transformedRow;
    })
    : data;

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function parseExcelFile(
  file: File | ArrayBuffer | Buffer,
  sheetIndex = 0,
  headerRow = 0,
): ExcelRow[] {
  let workbook: XLSX.WorkBook;

  if (file instanceof File) {
    throw new Error("File is not a valid Excel file");
  }

  workbook = XLSX.read(file, { type: file instanceof Buffer ? "buffer" : "array" });

  const sheetName = workbook.SheetNames[sheetIndex];

  if (!sheetName) {
    throw new Error(`Sheet ${sheetIndex} not found in the workbook`);
  }

  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
    header: headerRow,
    defval: null,
  });

  return jsonData;
}

export async function parsExcelFileAsync(
  file: File,
  sheetIndex = 0,
): Promise<ExcelRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[sheetIndex];

        if (!sheetName) {
          throw new Error(`Sheet at index ${sheetIndex} not found`);
        }

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
          defval: null,
        });

        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    }

    reader.onerror = (e) => reject(new Error("Failed to read Excel file"));
    reader.readAsArrayBuffer(file);
  })
}

export async function importExcelWithValidation<T extends ZodRawShape>(
  file: File | ArrayBuffer | Buffer,
  options: ImportOptions<T>
): Promise<ValidationResult<z.infer<typeof options.schema>>> {
  const {
    schema,
    sheetIndex = 0,
    headerMapping
  } = options;

  let rawData: ExcelRow[] = [];

  if (file instanceof File) {
    rawData = await parsExcelFileAsync(file, sheetIndex);
  } else {
    rawData = parseExcelFile(file, sheetIndex);
  }

  const mappedData = headerMapping
    ? rawData.map((row) => {
      const mappedRow: ExcelRow = {};

      for (const [excelHeader, schemaKey] of Object.entries(headerMapping)) {
        if (excelHeader in row) {
          mappedRow[schemaKey] = row[excelHeader];
        }
      }

      for (const [key, value] of Object.entries(row)) {
        if (!Object.keys(headerMapping).includes(key)) {
          mappedRow[key] = value;
        }
      }

      return mappedRow;
    })
    : rawData;

  const { success, data, errors } = validateData(mappedData, schema);

  return {
    success,
    data,
    errors,
    rawData: mappedData,
  }
}

// HELPERS
/**
 * Validate data array with Zod schema
 */
export function validateData<T extends ZodRawShape>(
  data: ExcelRow[],
  schema: ZodObject<T>
): ValidationResult<z.infer<typeof schema>> {
  const validData: z.infer<typeof schema>[] = [];
  const errors: ValidationError[] = [];

  data.forEach((row, index) => {
    const result = schema.safeParse(row);

    if (result.success) {
      validData.push(result.data);
    } else {
      const zodError = result.error as ZodError;
      zodError.issues.forEach((err) => {
        errors.push({
          row: index + 1,
          field: err.path.join("."),
          message: err.message,
          value: row[err.path[0] as string],
        });
      });
    }
  });

  return {
    success: errors.length === 0,
    data: validData,
    errors,
    rawData: data,
  };
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  return errors
    .map((err) =>
      `Row ${err.row}: ${err.field} - ${err.message} (value: ${JSON.stringify(err.value)})`
    )
    .join("\n");
}

/**
 * Group validation errors by row
 */
export function groupErrorsByRow(
  errors: ValidationError[]
): Record<number, ValidationError[]> {
  return errors.reduce(
    (acc, error) => {
      if (!acc[error.row]) {
        acc[error.row] = [];
      }
      acc[error.row].push(error);
      return acc;
    },
    {} as Record<number, ValidationError[]>
  );
}