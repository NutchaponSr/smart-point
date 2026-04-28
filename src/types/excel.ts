import { ZodObject, ZodRawShape } from "zod";

export type ExcelRow = Record<string, unknown>;

export interface ExportOptions {
  sheetName?: string;
  filename?: string;
  headers?: Record<string, string>;
}

export interface ImportOptions<T extends ZodRawShape> {
  schema: ZodObject<T>
  sheetIndex?: number;
  headerRow?: number;
  skipRows?: number;
  headerMapping?: Record<string, string>;
}

export interface ValidationResult<T> {
  success: boolean;
  data: T[];
  errors: ValidationError[];
  rawData: ExcelRow[];
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: unknown;
}

// DYNAMIC SCHEMA BUILDER
const fields = ["string", "number", "boolean", "date", "email", "url", "enum"];
type FieldType = typeof fields[number];

export interface DynamicFieldConfig {
  type: FieldType;
  required?: boolean;
  min?: number;
  max?: number;
  enumValues?: string[];
  regex?: RegExp;
  customMessage?: string;
}

export type FieldConfig = DynamicFieldConfig;