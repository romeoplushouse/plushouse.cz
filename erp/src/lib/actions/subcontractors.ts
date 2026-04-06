"use server";

import { prisma } from "@/lib/prisma";

export async function getSubcontractors(page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize;
  const [subcontractors, total] = await Promise.all([
    prisma.subcontractor.findMany({
      where: { isActive: true },
      include: {
        contact: true,
        priceListItems: true,
        projectWorkers: { include: { project: true }, take: 5 },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.subcontractor.count({ where: { isActive: true } }),
  ]);
  return { subcontractors, total, pages: Math.ceil(total / pageSize) };
}

export async function createSubcontractor(data: {
  // Contact data
  companyName: string;
  ico?: string;
  dic?: string;
  street?: string;
  city?: string;
  zip?: string;
  email?: string;
  phone?: string;
  bankAccount?: string;
  // Subcontractor-specific
  specialization?: string;
  trade?: string;
  hourlyRate?: number;
  dailyRate?: number;
  notes?: string;
}) {
  // First create the contact
  const contact = await prisma.contact.create({
    data: {
      type: "SUBCONTRACTOR",
      companyName: data.companyName,
      ico: data.ico,
      dic: data.dic,
      street: data.street,
      city: data.city,
      zip: data.zip,
      email: data.email,
      phone: data.phone,
      bankAccount: data.bankAccount,
    },
  });

  // Then create the subcontractor
  return prisma.subcontractor.create({
    data: {
      contactId: contact.id,
      specialization: data.specialization,
      trade: data.trade,
      hourlyRate: data.hourlyRate,
      dailyRate: data.dailyRate,
      notes: data.notes,
    },
    include: { contact: true },
  });
}

export async function getSubcontractorById(id: string) {
  return prisma.subcontractor.findUnique({
    where: { id },
    include: {
      contact: {
        include: {
          issuedInvoices: { orderBy: { issueDate: "desc" }, take: 10 },
          receivedInvoices: { orderBy: { issueDate: "desc" }, take: 10 },
          payments: { orderBy: { date: "desc" }, take: 10 },
        },
      },
      priceListItems: true,
      projectWorkers: { include: { project: true } },
    },
  });
}

export async function addPriceListItem(
  subcontractorId: string,
  data: {
    description: string;
    unit: string;
    unitPrice: number;
    category?: string;
  }
) {
  return prisma.subcontractorPrice.create({
    data: { subcontractorId, ...data },
  });
}

export async function removePriceListItem(id: string) {
  return prisma.subcontractorPrice.delete({ where: { id } });
}

export async function updateSubcontractor(
  id: string,
  data: Partial<{
    specialization: string;
    trade: string;
    hourlyRate: number;
    dailyRate: number;
    rating: number;
    hasFrameworkAgreement: boolean;
    agreementValidFrom: string;
    agreementValidTo: string;
    agreementDocUrl: string;
    notes: string;
  }>
) {
  const updateData: Record<string, unknown> = { ...data };
  if (data.agreementValidFrom)
    updateData.agreementValidFrom = new Date(data.agreementValidFrom);
  if (data.agreementValidTo)
    updateData.agreementValidTo = new Date(data.agreementValidTo);
  return prisma.subcontractor.update({ where: { id }, data: updateData });
}

export async function generateFrameworkAgreement(subcontractorId: string) {
  const sub = await prisma.subcontractor.findUnique({
    where: { id: subcontractorId },
    include: { contact: true, priceListItems: true },
  });
  if (!sub) throw new Error("Subdodavatel nenalezen");

  const org = await prisma.organization.findFirst();

  const today = new Date().toISOString().split("T")[0];
  const validTo = new Date();
  validTo.setFullYear(validTo.getFullYear() + 1);

  const priceTable = sub.priceListItems
    .map(
      (item) =>
        `| ${item.description} | ${item.unit} | ${Number(item.unitPrice).toLocaleString("cs-CZ")} Kč |`
    )
    .join("\n");

  const agreement = `
RÁMCOVÁ SMLOUVA O DÍLO

uzavřená dle § 2586 a násl. zákona č. 89/2012 Sb., občanský zákoník

SMLUVNÍ STRANY:

Objednatel:
${org?.name ?? "PLUS HOUSE s.r.o."}
IČO: ${org?.ico ?? ""}
DIČ: ${org?.dic ?? ""}
Sídlo: ${org?.street ?? ""}, ${org?.city ?? ""} ${org?.zip ?? ""}

Zhotovitel:
${sub.contact.companyName ?? ""}
IČO: ${sub.contact.ico ?? ""}
DIČ: ${sub.contact.dic ?? ""}
Sídlo: ${sub.contact.street ?? ""}, ${sub.contact.city ?? ""} ${sub.contact.zip ?? ""}

Specializace: ${sub.specialization ?? ""}
Obor: ${sub.trade ?? ""}

PŘEDMĚT SMLOUVY:
Touto rámcovou smlouvou se zhotovitel zavazuje provádět pro objednatele díla
v rozsahu své specializace dle jednotlivých objednávek objednatele.

CENÍK PRACÍ:
| Popis | Jednotka | Cena |
|-------|----------|------|
${priceTable || "| Dle individuální dohody | - | - |"}

${sub.hourlyRate ? `Hodinová sazba: ${Number(sub.hourlyRate).toLocaleString("cs-CZ")} Kč/hod` : ""}
${sub.dailyRate ? `Denní sazba: ${Number(sub.dailyRate).toLocaleString("cs-CZ")} Kč/den` : ""}

DOBA TRVÁNÍ:
Smlouva je uzavřena na dobu určitou od ${today} do ${validTo.toISOString().split("T")[0]}.

PLATEBNÍ PODMÍNKY:
Splatnost faktur: 14 dnů od doručení.
Forma úhrady: Bankovní převod na účet zhotovitele.

KVALITA DÍLA:
Zhotovitel se zavazuje provádět dílo v kvalitě odpovídající příslušným
technickým normám a v souladu s pokyny objednatele.

FOTODOKUMENTACE:
Zhotovitel je povinen pořídit fotografickou dokumentaci stavu před zahájením
prací a po jejich dokončení.

V _____________ dne ${today}

_________________________          _________________________
${org?.name ?? "Objednatel"}                    ${sub.contact.companyName ?? "Zhotovitel"}
`.trim();

  // Update the subcontractor record
  await prisma.subcontractor.update({
    where: { id: subcontractorId },
    data: {
      hasFrameworkAgreement: true,
      agreementValidFrom: new Date(today),
      agreementValidTo: validTo,
    },
  });

  return agreement;
}
