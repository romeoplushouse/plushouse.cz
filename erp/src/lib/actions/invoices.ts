"use server";

import { prisma } from "@/lib/prisma";
import { generateDocumentNumber, generateQRPaymentCode } from "@/lib/utils";

export async function getInvoices(
  filter?: {
    type?: string;
    status?: string;
  },
  page = 1,
  pageSize = 20
) {
  const where: Record<string, unknown> = {};
  if (filter?.type) where.type = filter.type;
  if (filter?.status) where.status = filter.status;

  const skip = (page - 1) * pageSize;
  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        customer: true,
        supplier: true,
        items: true,
      },
      orderBy: { issueDate: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.invoice.count({ where }),
  ]);

  return { invoices, total, pages: Math.ceil(total / pageSize) };
}

export async function createInvoice(data: {
  type: "ISSUED" | "RECEIVED" | "ADVANCE" | "TAX_DOCUMENT" | "CREDIT_NOTE" | "PROFORMA";
  customerId?: string;
  supplierId?: string;
  issueDate: string;
  dueDate: string;
  taxDate?: string;
  currency?: string;
  variableSymbol?: string;
  bankAccount?: string;
  paymentMethod?: string;
  notes?: string;
  projectId?: string;
  items: Array<{
    description: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    vatRate?: number;
  }>;
}) {
  const year = new Date(data.issueDate).getFullYear();
  const prefix = data.type === "RECEIVED" ? "FP" : "FV";
  if (data.type === "ADVANCE") {
    // ZF for zálohovka
  }

  const count = await prisma.invoice.count({
    where: { invoiceNumber: { startsWith: `${prefix}-${year}` } },
  });
  const invoiceNumber = generateDocumentNumber(prefix, year, count + 1);

  // Calculate totals
  const calculatedItems = data.items.map((item, index) => {
    const vatRate = item.vatRate ?? 21;
    const subtotal = item.quantity * item.unitPrice;
    const vatAmount = subtotal * (vatRate / 100);
    return {
      description: item.description,
      quantity: item.quantity,
      unit: item.unit ?? "ks",
      unitPrice: item.unitPrice,
      vatRate,
      vatAmount: Math.round(vatAmount * 100) / 100,
      total: Math.round((subtotal + vatAmount) * 100) / 100,
      sortOrder: index,
    };
  });

  const subtotal = calculatedItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const vatAmount = calculatedItems.reduce(
    (sum, item) => sum + item.vatAmount,
    0
  );
  const total = subtotal + vatAmount;

  // Generate QR payment code if bank account is provided
  let qrPaymentCode: string | undefined;
  if (data.bankAccount && data.type !== "RECEIVED") {
    qrPaymentCode = generateQRPaymentCode({
      iban: data.bankAccount,
      amount: total,
      variableSymbol: data.variableSymbol ?? invoiceNumber.replace(/\D/g, ""),
    });
  }

  return prisma.invoice.create({
    data: {
      invoiceNumber,
      type: data.type,
      customerId: data.customerId,
      supplierId: data.supplierId,
      issueDate: new Date(data.issueDate),
      dueDate: new Date(data.dueDate),
      taxDate: data.taxDate ? new Date(data.taxDate) : null,
      subtotal,
      vatAmount,
      total,
      currency: data.currency ?? "CZK",
      variableSymbol: data.variableSymbol,
      bankAccount: data.bankAccount,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      projectId: data.projectId,
      qrPaymentCode,
      items: { create: calculatedItems },
    },
    include: { items: true, customer: true },
  });
}

export async function getInvoiceById(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      supplier: true,
      items: { orderBy: { sortOrder: "asc" } },
      payments: true,
      project: true,
    },
  });
}

export async function updateInvoiceStatus(
  id: string,
  status: "DRAFT" | "SENT" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED"
) {
  return prisma.invoice.update({
    where: { id },
    data: {
      status,
      ...(status === "PAID" ? { paidAt: new Date() } : {}),
    },
  });
}

export async function getInvoicesByContact(
  contactId: string,
  page = 1,
  pageSize = 20
) {
  const skip = (page - 1) * pageSize;
  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        OR: [{ customerId: contactId }, { supplierId: contactId }],
      },
      include: {
        customer: true,
        supplier: true,
        items: true,
      },
      orderBy: { issueDate: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.invoice.count({
      where: {
        OR: [{ customerId: contactId }, { supplierId: contactId }],
      },
    }),
  ]);

  return { invoices, total, pages: Math.ceil(total / pageSize) };
}

export async function getInvoiceStats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [unpaidIssued, overdue, paidThisMonth, unpaidReceived] =
    await Promise.all([
      prisma.invoice.aggregate({
        where: {
          type: "ISSUED",
          status: { in: ["SENT", "PARTIALLY_PAID"] },
        },
        _sum: { total: true },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: { status: "OVERDUE" },
        _sum: { total: true },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: {
          status: "PAID",
          paidAt: { gte: monthStart },
        },
        _sum: { total: true },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: {
          type: "RECEIVED",
          status: { in: ["SENT", "PARTIALLY_PAID"] },
        },
        _sum: { total: true },
        _count: true,
      }),
    ]);

  return {
    unpaidIssued: {
      amount: Number(unpaidIssued._sum.total ?? 0),
      count: unpaidIssued._count,
    },
    overdue: {
      amount: Number(overdue._sum.total ?? 0),
      count: overdue._count,
    },
    paidThisMonth: {
      amount: Number(paidThisMonth._sum.total ?? 0),
      count: paidThisMonth._count,
    },
    unpaidReceived: {
      amount: Number(unpaidReceived._sum.total ?? 0),
      count: unpaidReceived._count,
    },
  };
}
