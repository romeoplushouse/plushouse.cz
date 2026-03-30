"use server";

import { prisma } from "@/lib/prisma";

export async function recordPayment(data: {
  invoiceId?: string;
  contactId?: string;
  date: string;
  amount: number;
  currency?: string;
  type: "INCOMING" | "OUTGOING";
  method: "BANK_TRANSFER" | "CASH" | "CARD" | "QR_PAYMENT" | "OTHER";
  variableSymbol?: string;
  bankReference?: string;
  note?: string;
}) {
  const payment = await prisma.payment.create({
    data: {
      ...data,
      date: new Date(data.date),
      currency: data.currency ?? "CZK",
    },
  });

  // Auto-update invoice status if linked
  if (data.invoiceId) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: data.invoiceId },
    });
    if (invoice) {
      const newPaidAmount = Number(invoice.paidAmount) + data.amount;
      const invoiceTotal = Number(invoice.total);
      const status =
        newPaidAmount >= invoiceTotal ? "PAID" : "PARTIALLY_PAID";

      await prisma.invoice.update({
        where: { id: data.invoiceId },
        data: {
          paidAmount: newPaidAmount,
          status,
          ...(status === "PAID" ? { paidAt: new Date() } : {}),
        },
      });
    }
  }

  return payment;
}

export async function processBankNotification(data: {
  bankAccount: string;
  transactionId: string;
  date: string;
  amount: number;
  currency?: string;
  counterpartAccount?: string;
  counterpartName?: string;
  variableSymbol?: string;
  constantSymbol?: string;
  specificSymbol?: string;
  message?: string;
}) {
  // Create bank notification
  const notification = await prisma.bankNotification.create({
    data: {
      ...data,
      date: new Date(data.date),
      currency: data.currency ?? "CZK",
    },
  });

  // Try to auto-match with an invoice by variable symbol
  if (data.variableSymbol) {
    const invoice = await prisma.invoice.findFirst({
      where: {
        variableSymbol: data.variableSymbol,
        status: { in: ["SENT", "PARTIALLY_PAID"] },
      },
    });

    if (invoice) {
      const payment = await recordPayment({
        invoiceId: invoice.id,
        date: data.date,
        amount: data.amount,
        type: data.amount > 0 ? "INCOMING" : "OUTGOING",
        method: "BANK_TRANSFER",
        variableSymbol: data.variableSymbol,
        bankReference: data.transactionId,
      });

      await prisma.bankNotification.update({
        where: { id: notification.id },
        data: {
          isProcessed: true,
          matchedPaymentId: payment.id,
        },
      });
    }
  }

  return notification;
}

export async function getUnprocessedBankNotifications() {
  return prisma.bankNotification.findMany({
    where: { isProcessed: false },
    orderBy: { date: "desc" },
  });
}

export async function getPaymentHistory(page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize;
  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      include: { invoice: true, contact: true },
      orderBy: { date: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.payment.count(),
  ]);

  return { payments, total, pages: Math.ceil(total / pageSize) };
}
