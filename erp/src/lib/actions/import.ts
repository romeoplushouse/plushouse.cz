"use server";

import { prisma } from "@/lib/prisma";

// Column mapping from Czech XLSX/CSV headers to Contact fields
const COLUMN_MAP: Record<string, string> = {
  "Firma": "companyName",
  "IČ": "ico",
  "DIČ / IČ DPH": "dic",
  "DIČ (SK)": "dicSk",
  "Ulice": "street",
  "PSČ": "zip",
  "Město": "city",
  "Stát": "country",
  "E-mailová adresa": "email",
  "Další příjemci": "emailCc",
  "Telefon": "phone",
  "www": "website",
  "Sleva": "discount",
  "Splatnost": "paymentTerms",
  "Nastavení odesílaní upomínek": "reminderSettings",
  "Titul": "title",
  "Jméno": "firstName",
  "Příjmení": "lastName",
  "Mobil": "mobile",
  "Číslo účtu": "bankAccount",
  "Kód banky": "bankCode",
  "IBAN": "iban",
  "SWIFT": "swift",
};

export type ImportRow = {
  companyName?: string;
  ico?: string;
  dic?: string;
  dicSk?: string;
  street?: string;
  zip?: string;
  city?: string;
  country?: string;
  email?: string;
  emailCc?: string;
  phone?: string;
  website?: string;
  discount?: string;
  paymentTerms?: string;
  reminderSettings?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  bankAccount?: string;
  bankCode?: string;
  iban?: string;
  swift?: string;
};

export async function parseImportData(
  rows: Array<Record<string, string>>
): Promise<{
  parsed: ImportRow[];
  errors: Array<{ row: number; message: string }>;
}> {
  const parsed: ImportRow[] = [];
  const errors: Array<{ row: number; message: string }> = [];

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const mapped: ImportRow = {};

    for (const [header, value] of Object.entries(raw)) {
      const trimmedHeader = header.trim();
      const field = COLUMN_MAP[trimmedHeader];
      if (field && value) {
        (mapped as Record<string, string>)[field] = String(value).trim();
      }
    }

    // Validate - need at least company name or first+last name
    if (!mapped.companyName && !mapped.firstName && !mapped.lastName) {
      errors.push({ row: i + 2, message: "Chybí název firmy nebo jméno kontaktu" });
      continue;
    }

    parsed.push(mapped);
  }

  return { parsed, errors };
}

export async function importContacts(
  rows: ImportRow[],
  defaultType: "CUSTOMER" | "SUPPLIER" | "SUBCONTRACTOR" | "OTHER" = "CUSTOMER"
): Promise<{
  imported: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
}> {
  let imported = 0;
  let skipped = 0;
  const errors: Array<{ row: number; message: string }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    try {
      // Check for duplicate by ICO
      if (row.ico) {
        const existing = await prisma.contact.findFirst({
          where: { ico: row.ico, isActive: true },
        });
        if (existing) {
          skipped++;
          continue;
        }
      }

      // Check for duplicate by email
      if (row.email) {
        const existing = await prisma.contact.findFirst({
          where: { email: row.email, isActive: true },
        });
        if (existing) {
          skipped++;
          continue;
        }
      }

      // Map country code
      let country = row.country ?? "CZ";
      if (country.toLowerCase() === "česká republika" || country.toLowerCase() === "czech republic") {
        country = "CZ";
      } else if (country.toLowerCase() === "slovensko" || country.toLowerCase() === "slovakia") {
        country = "SK";
      }

      // Build bank account string
      let bankAccount = row.bankAccount;
      if (bankAccount && row.bankCode) {
        bankAccount = `${bankAccount}/${row.bankCode}`;
      }

      await prisma.contact.create({
        data: {
          type: defaultType,
          companyName: row.companyName || null,
          firstName: row.firstName || null,
          lastName: row.lastName || null,
          ico: row.ico || null,
          dic: row.dic || null,
          street: row.street || null,
          zip: row.zip || null,
          city: row.city || null,
          country,
          email: row.email || null,
          phone: row.phone || row.mobile || null,
          website: row.website || null,
          bankAccount: bankAccount || row.iban || null,
          bankCode: row.bankCode || null,
          notes: [
            row.discount ? `Sleva: ${row.discount}` : null,
            row.paymentTerms ? `Splatnost: ${row.paymentTerms}` : null,
            row.swift ? `SWIFT: ${row.swift}` : null,
            row.iban ? `IBAN: ${row.iban}` : null,
            row.emailCc ? `CC: ${row.emailCc}` : null,
          ].filter(Boolean).join("\n") || null,
        },
      });

      imported++;
    } catch (err) {
      errors.push({
        row: i + 2,
        message: err instanceof Error ? err.message : "Neznámá chyba",
      });
    }
  }

  return { imported, skipped, errors };
}

export async function getColumnMap() {
  return COLUMN_MAP;
}
