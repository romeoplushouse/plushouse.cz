import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "CZK"): string {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("cs-CZ").format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("cs-CZ", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

export function generateDocumentNumber(
  prefix: string,
  year: number,
  sequence: number
): string {
  return `${prefix}-${year}-${String(sequence).padStart(4, "0")}`;
}

export function generateQRPaymentCode(params: {
  iban: string;
  amount: number;
  currency?: string;
  variableSymbol?: string;
  message?: string;
}): string {
  const { iban, amount, currency = "CZK", variableSymbol, message } = params;
  let code = `SPD*1.0*ACC:${iban}*AM:${amount.toFixed(2)}*CC:${currency}`;
  if (variableSymbol) code += `*X-VS:${variableSymbol}`;
  if (message) code += `*MSG:${message}`;
  return code;
}
