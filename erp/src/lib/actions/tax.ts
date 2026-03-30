"use server";

import { prisma } from "@/lib/prisma";

export async function generateVatReturn(periodFrom: string, periodTo: string) {
  // Gather all posted invoices in the period
  const invoices = await prisma.invoice.findMany({
    where: {
      taxDate: {
        gte: new Date(periodFrom),
        lte: new Date(periodTo),
      },
      status: { not: "CANCELLED" },
    },
    include: { items: true, customer: true, supplier: true },
  });

  // Calculate VAT totals by rate
  let totalBase21 = 0,
    totalVat21 = 0;
  let totalBase15 = 0,
    totalVat15 = 0;
  let totalBase12 = 0,
    totalVat12 = 0;
  let totalBase0 = 0;

  for (const invoice of invoices) {
    for (const item of invoice.items) {
      const rate = Number(item.vatRate);
      const base = Number(item.unitPrice) * Number(item.quantity);
      const vat = Number(item.vatAmount);

      if (rate === 21) {
        totalBase21 += base;
        totalVat21 += vat;
      } else if (rate === 15) {
        totalBase15 += base;
        totalVat15 += vat;
      } else if (rate === 12) {
        totalBase12 += base;
        totalVat12 += vat;
      } else {
        totalBase0 += base;
      }
    }
  }

  // Determine period name
  const from = new Date(periodFrom);
  const to = new Date(periodTo);
  const period =
    from.getMonth() === to.getMonth()
      ? `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}`
      : `${from.getFullYear()}-Q${Math.ceil((from.getMonth() + 1) / 3)}`;

  // Generate XML for Czech tax authority (simplified structure)
  const xmlExport = generateVatReturnXML({
    period,
    periodFrom,
    periodTo,
    totalBase21,
    totalVat21,
    totalBase15,
    totalVat15,
    totalBase12,
    totalVat12,
    totalBase0,
  });

  return prisma.vatReturn.create({
    data: {
      period,
      periodFrom: new Date(periodFrom),
      periodTo: new Date(periodTo),
      status: "GENERATED",
      totalBase21,
      totalVat21,
      totalBase15,
      totalVat15,
      totalBase12,
      totalVat12,
      totalBase0,
      xmlExport,
      generatedBy: "SYSTEM",
      generatedAt: new Date(),
    },
  });
}

function generateVatReturnXML(data: {
  period: string;
  periodFrom: string;
  periodTo: string;
  totalBase21: number;
  totalVat21: number;
  totalBase15: number;
  totalVat15: number;
  totalBase12: number;
  totalVat12: number;
  totalBase0: number;
}): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Pisemnost nazevSW="PlusHouse ERP" verzeSW="0.1.0">
  <DPHDP3 verzePis="03.02">
    <VetaD
      k_uladis="DPH"
      dokession="${data.period}"
      d_poddam="${new Date().toISOString().split("T")[0]}"
      zdobd_od="${data.periodFrom}"
      zdobd_do="${data.periodTo}"
    />
    <VetaE
      dan_zan21="${Math.round(data.totalVat21)}"
      obrat21="${Math.round(data.totalBase21)}"
      dan_zan15="${Math.round(data.totalVat15)}"
      obrat15="${Math.round(data.totalBase15)}"
      dan_zan12="${Math.round(data.totalVat12)}"
      obrat12="${Math.round(data.totalBase12)}"
      pln_nep="${Math.round(data.totalBase0)}"
    />
  </DPHDP3>
</Pisemnost>`;
}

export async function generateControlReport(
  periodFrom: string,
  periodTo: string
) {
  const invoices = await prisma.invoice.findMany({
    where: {
      taxDate: {
        gte: new Date(periodFrom),
        lte: new Date(periodTo),
      },
      status: { not: "CANCELLED" },
    },
    include: { items: true, customer: true, supplier: true },
  });

  const from = new Date(periodFrom);
  const period = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}`;

  // Build control report items
  const reportItems: Array<{
    section: string;
    invoiceId: string;
    partnerDic: string;
    documentNumber: string;
    date: Date;
    base: number;
    vat: number;
    vatRate: number;
  }> = [];

  for (const invoice of invoices) {
    const partnerDic =
      invoice.customer?.dic ?? invoice.supplier?.dic ?? "";
    const totalBase = Number(invoice.subtotal);
    const totalVat = Number(invoice.vatAmount);
    const avgRate =
      totalBase > 0 ? (totalVat / totalBase) * 100 : 21;

    // Determine section based on invoice type and amount
    let section: string;
    if (invoice.type === "ISSUED") {
      section = totalBase > 10000 ? "A.4" : "A.5";
    } else {
      section = totalBase > 10000 ? "B.2" : "B.3";
    }

    reportItems.push({
      section,
      invoiceId: invoice.id,
      partnerDic,
      documentNumber: invoice.invoiceNumber,
      date: invoice.taxDate ?? invoice.issueDate,
      base: totalBase,
      vat: totalVat,
      vatRate: avgRate,
    });
  }

  return prisma.controlReport.create({
    data: {
      period,
      periodFrom: new Date(periodFrom),
      periodTo: new Date(periodTo),
      status: "GENERATED",
      generatedAt: new Date(),
      items: {
        create: reportItems.map((item) => ({
          section: item.section,
          invoiceId: item.invoiceId,
          partnerDic: item.partnerDic,
          documentNumber: item.documentNumber,
          date: item.date,
          base: item.base,
          vat: item.vat,
          vatRate: item.vatRate,
        })),
      },
    },
    include: { items: true },
  });
}

export async function getVatReturns() {
  return prisma.vatReturn.findMany({
    orderBy: { periodFrom: "desc" },
  });
}

export async function getControlReports() {
  return prisma.controlReport.findMany({
    orderBy: { periodFrom: "desc" },
    include: { items: true },
  });
}

export async function getIncomeTaxReturns() {
  return prisma.incomeTaxReturn.findMany({
    orderBy: { year: "desc" },
  });
}
