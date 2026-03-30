"use server";

import { prisma } from "@/lib/prisma";
import { generateDocumentNumber } from "@/lib/utils";

export async function getJournalEntries(page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize;
  const [entries, total] = await Promise.all([
    prisma.journalEntry.findMany({
      include: { items: { include: { account: true } } },
      orderBy: { date: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.journalEntry.count(),
  ]);
  return { entries, total, pages: Math.ceil(total / pageSize) };
}

export async function createJournalEntry(data: {
  date: string;
  description: string;
  documentRef?: string;
  documentType?: string;
  items: Array<{
    accountCode: string;
    debit: number;
    credit: number;
    description?: string;
  }>;
}) {
  // Validate: total debits must equal total credits
  const totalDebit = data.items.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = data.items.reduce((sum, item) => sum + item.credit, 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(
      `Strana MD (${totalDebit}) se nerovná straně D (${totalCredit}). Účetní zápis musí být vyrovnaný.`
    );
  }

  // Generate entry number
  const year = new Date(data.date).getFullYear();
  const count = await prisma.journalEntry.count({
    where: {
      entryNumber: { startsWith: `UD-${year}` },
    },
  });

  const entryNumber = generateDocumentNumber("UD", year, count + 1);

  return prisma.journalEntry.create({
    data: {
      entryNumber,
      date: new Date(data.date),
      description: data.description,
      documentRef: data.documentRef,
      documentType: data.documentType,
      items: {
        create: data.items.map((item) => ({
          accountCode: item.accountCode,
          debit: item.debit,
          credit: item.credit,
          description: item.description,
        })),
      },
    },
    include: { items: true },
  });
}

export async function postJournalEntry(id: string) {
  return prisma.journalEntry.update({
    where: { id },
    data: { isPosted: true },
  });
}

export async function getChartOfAccounts() {
  return prisma.chartOfAccounts.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
  });
}

export async function getTrialBalance(dateFrom?: string, dateTo?: string) {
  const where: Record<string, unknown> = { isPosted: true };
  if (dateFrom || dateTo) {
    where.journalEntry = {
      date: {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      },
    };
  }

  const items = await prisma.journalEntryItem.findMany({
    where,
    include: { account: true, journalEntry: true },
  });

  // Aggregate by account
  const accountMap = new Map<
    string,
    { code: string; name: string; type: string; debit: number; credit: number }
  >();

  for (const item of items) {
    const key = item.accountCode;
    if (!accountMap.has(key)) {
      accountMap.set(key, {
        code: item.account.code,
        name: item.account.name,
        type: item.account.type,
        debit: 0,
        credit: 0,
      });
    }
    const acc = accountMap.get(key)!;
    acc.debit += Number(item.debit);
    acc.credit += Number(item.credit);
  }

  return Array.from(accountMap.values()).sort((a, b) =>
    a.code.localeCompare(b.code)
  );
}
