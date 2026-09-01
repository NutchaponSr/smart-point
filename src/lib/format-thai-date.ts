import { format } from "date-fns";
import { th } from "date-fns/locale";

export function formatThaiDate(date: Date | number): string {
  const value = typeof date === "number" ? new Date(date) : date;

  return value.toLocaleDateString("th-TH-u-ca-buddhist", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const dateFormatOptions: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

export function formatLocalizedDate(date: Date | number, locale: string): string {
  const value = typeof date === "number" ? new Date(date) : date;

  if (locale === "th") {
    return formatThaiDate(value);
  }

  return value.toLocaleDateString("en-GB", dateFormatOptions);
}

export function formatThaiMonthYear(date: Date): string {
  const month = format(date, "LLLL", { locale: th });
  const year = date.getFullYear() + 543;
  return `${month} ${year}`;
}

export const thaiDayPickerFormatters = {
  formatCaption: (month: Date) => formatThaiMonthYear(month),
};
