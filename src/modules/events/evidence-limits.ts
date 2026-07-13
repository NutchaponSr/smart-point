export const EVIDENCE_IMAGE_MAX_BYTES = 1_048_576;
export const EVIDENCE_PDF_MAX_BYTES = 5_242_880;

export const EVIDENCE_ACCEPT =
  ".pdf,application/pdf,image/jpeg,image/png,image/webp";

export const EVIDENCE_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export function formatEvidenceMaxSize(bytes: number) {
  return `${(bytes / 1_048_576).toFixed(0)} MB`;
}

export function formatFileSize(bytes: number) {
  if (bytes >= 1_048_576) {
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function getEvidenceFileKind(file: File): "pdf" | "image" | null {
  const lowerName = file.name.toLowerCase();
  if (
    file.type === "application/pdf" ||
    lowerName.endsWith(".pdf")
  ) {
    return "pdf";
  }
  if (
    EVIDENCE_IMAGE_MIME_TYPES.includes(
      file.type as (typeof EVIDENCE_IMAGE_MIME_TYPES)[number],
    ) ||
    /\.(jpe?g|png|webp)$/i.test(lowerName)
  ) {
    return "image";
  }
  return null;
}
