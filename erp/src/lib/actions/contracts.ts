"use server";

import { prisma } from "@/lib/prisma";
import { generateDocumentNumber } from "@/lib/utils";
import crypto from "crypto";

// ============================================================================
// Contract Management & Electronic Signing
// ============================================================================

const CONTRACT_TEMPLATES: Record<string, { title: string; html: string }> = {
  EMPLOYMENT_DPP: {
    title: "Dohoda o provedení práce",
    html: `
<h1>DOHODA O PROVEDENÍ PRÁCE</h1>
<p>uzavřená dle § 75 zákona č. 262/2006 Sb., zákoník práce</p>
<h2>Smluvní strany</h2>
<p><strong>Zaměstnavatel:</strong> {{partyAName}}, IČO: {{partyAIco}}, sídlo: {{partyAAddress}}</p>
<p>zastoupený: {{partyARepresentative}}</p>
<p><strong>Zaměstnanec:</strong> {{partyBName}}, bytem: {{partyBAddress}}</p>
<p>narozen(a): {{field:birth_date:Datum narození:DATE}}</p>
<p>číslo OP: {{field:id_card_number:Číslo občanského průkazu:TEXT}}</p>
<h2>Předmět dohody</h2>
<p>{{field:work_description:Druh práce (popis):TEXT}}</p>
<h2>Rozsah práce</h2>
<p>Rozsah práce nesmí překročit 300 hodin v kalendářním roce.</p>
<p>Sjednaný rozsah: {{field:hours:Počet hodin:NUMBER}} hodin</p>
<h2>Odměna</h2>
<p>Sjednaná odměna: {{field:rate:Odměna za hodinu (Kč):NUMBER}} Kč/hod</p>
<p>Celková odměna: {{totalAmount}} Kč</p>
<h2>Doba trvání</h2>
<p>Od: {{validFrom}} Do: {{validTo}}</p>
<h2>Místo výkonu práce</h2>
<p>{{field:workplace:Místo výkonu práce:TEXT}}</p>
`,
  },
  EMPLOYMENT_DPC: {
    title: "Dohoda o pracovní činnosti",
    html: `
<h1>DOHODA O PRACOVNÍ ČINNOSTI</h1>
<p>uzavřená dle § 76 zákona č. 262/2006 Sb., zákoník práce</p>
<h2>Smluvní strany</h2>
<p><strong>Zaměstnavatel:</strong> {{partyAName}}, IČO: {{partyAIco}}, sídlo: {{partyAAddress}}</p>
<p><strong>Zaměstnanec:</strong> {{partyBName}}, bytem: {{partyBAddress}}</p>
<p>narozen(a): {{field:birth_date:Datum narození:DATE}}</p>
<p>číslo OP: {{field:id_card_number:Číslo občanského průkazu:TEXT}}</p>
<h2>Sjednaný druh práce</h2>
<p>{{field:work_description:Druh práce:TEXT}}</p>
<h2>Rozsah pracovní doby</h2>
<p>Rozsah nesmí překročit polovinu stanovené týdenní pracovní doby (20 hod/týden).</p>
<p>Sjednaný rozsah: {{field:hours_weekly:Hodin týdně:NUMBER}} hodin/týden</p>
<h2>Odměna</h2>
<p>{{field:rate:Měsíční odměna (Kč):NUMBER}} Kč/měsíc</p>
<h2>Doba trvání</h2>
<p>Od: {{validFrom}} Do: {{validTo}}</p>
`,
  },
  EMPLOYMENT_HPP: {
    title: "Pracovní smlouva",
    html: `
<h1>PRACOVNÍ SMLOUVA</h1>
<p>uzavřená dle § 33 zákona č. 262/2006 Sb., zákoník práce</p>
<h2>Smluvní strany</h2>
<p><strong>Zaměstnavatel:</strong> {{partyAName}}, IČO: {{partyAIco}}, DIČ: {{partyADic}}, sídlo: {{partyAAddress}}</p>
<p>zastoupený: {{partyARepresentative}}</p>
<p><strong>Zaměstnanec:</strong> {{partyBName}}, bytem: {{partyBAddress}}</p>
<p>narozen(a): {{field:birth_date:Datum narození:DATE}}</p>
<p>rodné číslo: {{field:personal_id:Rodné číslo:TEXT}}</p>
<p>číslo OP: {{field:id_card_number:Číslo občanského průkazu:TEXT}}</p>
<p>druhý doklad: {{field:second_id_type:Typ druhého dokladu:TEXT}} č. {{field:second_id_number:Číslo druhého dokladu:TEXT}}</p>
<h2>Druh práce</h2>
<p>{{field:job_title:Pracovní pozice:TEXT}}</p>
<h2>Místo výkonu práce</h2>
<p>{{field:workplace:Místo výkonu práce:TEXT}}</p>
<h2>Den nástupu</h2>
<p>{{validFrom}}</p>
<h2>Zkušební doba</h2>
<p>{{field:probation:Zkušební doba (měsíce):NUMBER}} měsíců</p>
<h2>Mzda</h2>
<p>Hrubá měsíční mzda: {{field:salary:Hrubá měsíční mzda (Kč):NUMBER}} Kč</p>
<h2>Pracovní doba</h2>
<p>{{field:work_hours:Týdenní pracovní doba (hodin):NUMBER}} hodin týdně</p>
<h2>Dovolená</h2>
<p>{{field:vacation_days:Počet dnů dovolené:NUMBER}} pracovních dnů ročně</p>
`,
  },
  EMPLOYMENT_SOD: {
    title: "Smlouva o dílo",
    html: `
<h1>SMLOUVA O DÍLO</h1>
<p>uzavřená dle § 2586 a násl. zákona č. 89/2012 Sb., občanský zákoník</p>
<h2>Smluvní strany</h2>
<p><strong>Objednatel:</strong> {{partyAName}}, IČO: {{partyAIco}}, sídlo: {{partyAAddress}}</p>
<p><strong>Zhotovitel:</strong> {{partyBName}}, IČO: {{partyBIco}}, DIČ: {{partyBDic}}, sídlo: {{partyBAddress}}</p>
<h2>Předmět smlouvy</h2>
<p>{{field:work_description:Popis díla:TEXT}}</p>
<h2>Cena díla</h2>
<p>{{totalAmount}} Kč bez DPH</p>
<h2>Termín plnění</h2>
<p>Od: {{validFrom}} Do: {{validTo}}</p>
<h2>Místo plnění</h2>
<p>{{field:location:Místo plnění:TEXT}}</p>
`,
  },
  EMPLOYMENT_RS: {
    title: "Rámcová smlouva",
    html: `
<h1>RÁMCOVÁ SMLOUVA</h1>
<p>uzavřená dle § 1746 odst. 2 zákona č. 89/2012 Sb., občanský zákoník</p>
<h2>Smluvní strany</h2>
<p><strong>Objednatel:</strong> {{partyAName}}, IČO: {{partyAIco}}, sídlo: {{partyAAddress}}</p>
<p><strong>Dodavatel:</strong> {{partyBName}}, IČO: {{partyBIco}}, sídlo: {{partyBAddress}}</p>
<h2>Předmět smlouvy</h2>
<p>{{field:subject:Předmět rámcové smlouvy:TEXT}}</p>
<h2>Doba trvání</h2>
<p>Od: {{validFrom}} Do: {{validTo}}</p>
<h2>Cenové podmínky</h2>
<p>{{field:pricing:Cenové podmínky:TEXT}}</p>
`,
  },
};

export async function getContracts(
  filter?: { type?: string; status?: string },
  page = 1,
  pageSize = 20
) {
  const where: Record<string, unknown> = {};
  if (filter?.type) where.type = filter.type;
  if (filter?.status) where.status = filter.status;

  const skip = (page - 1) * pageSize;
  const [contracts, total] = await Promise.all([
    prisma.contract.findMany({
      where,
      include: {
        signingRequests: { orderBy: { signingOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.contract.count({ where }),
  ]);
  return { contracts, total, pages: Math.ceil(total / pageSize) };
}

export async function createContract(data: {
  type: string;
  title?: string;
  partyBName: string;
  partyBIco?: string;
  partyBDic?: string;
  partyBAddress?: string;
  partyBRepresentative?: string;
  contactId?: string;
  employeeId?: string;
  projectId?: string;
  validFrom?: string;
  validTo?: string;
  totalAmount?: number;
  notes?: string;
}) {
  const year = new Date().getFullYear();
  const count = await prisma.contract.count({
    where: { contractNumber: { startsWith: `SML-${year}` } },
  });
  const contractNumber = generateDocumentNumber("SML", year, count + 1);

  // Get organization data for Party A
  const org = await prisma.organization.findFirst();
  const template = CONTRACT_TEMPLATES[data.type];

  // Parse fillable fields from template
  const fieldRegex = /\{\{field:(\w+):([^:]+):(\w+)\}\}/g;
  const fields: Array<{
    fieldName: string;
    fieldLabel: string;
    fieldType: string;
  }> = [];

  if (template) {
    let match;
    while ((match = fieldRegex.exec(template.html)) !== null) {
      fields.push({
        fieldName: match[1],
        fieldLabel: match[2],
        fieldType: match[3],
      });
    }
  }

  // Add standard identity fields if not already present
  const standardFields = [
    { fieldName: "id_card_number", fieldLabel: "Číslo občanského průkazu", fieldType: "TEXT" },
    { fieldName: "id_card_type", fieldLabel: "Typ dokladu totožnosti", fieldType: "TEXT" },
    { fieldName: "second_id_number", fieldLabel: "Číslo druhého dokladu", fieldType: "TEXT" },
    { fieldName: "second_id_type", fieldLabel: "Typ druhého dokladu", fieldType: "TEXT" },
  ];

  for (const sf of standardFields) {
    if (!fields.find((f) => f.fieldName === sf.fieldName)) {
      fields.push(sf);
    }
  }

  const contract = await prisma.contract.create({
    data: {
      contractNumber,
      type: data.type as "EMPLOYMENT_SOD" | "EMPLOYMENT_RS" | "EMPLOYMENT_DPC" | "EMPLOYMENT_DPP" | "EMPLOYMENT_HPP" | "SUBCONTRACTOR" | "NDA" | "SERVICE" | "LEASE" | "OTHER",
      title: data.title ?? template?.title ?? "Smlouva",
      htmlContent: template?.html ?? null,
      partyAName: org?.name ?? "PLUS HOUSE s.r.o.",
      partyAIco: org?.ico,
      partyADic: org?.dic,
      partyAAddress: [org?.street, org?.city, org?.zip].filter(Boolean).join(", "),
      partyBName: data.partyBName,
      partyBIco: data.partyBIco,
      partyBDic: data.partyBDic,
      partyBAddress: data.partyBAddress,
      partyBRepresentative: data.partyBRepresentative,
      contactId: data.contactId,
      employeeId: data.employeeId,
      projectId: data.projectId,
      validFrom: data.validFrom ? new Date(data.validFrom) : null,
      validTo: data.validTo ? new Date(data.validTo) : null,
      totalAmount: data.totalAmount,
      status: "DRAFT",
      fillableFields: {
        create: fields.map((f) => ({
          fieldName: f.fieldName,
          fieldLabel: f.fieldLabel,
          fieldType: f.fieldType,
          isRequired: true,
        })),
      },
    },
    include: { fillableFields: true },
  });

  // Audit
  await prisma.contractAuditEntry.create({
    data: {
      contractId: contract.id,
      action: "CREATED",
      actor: "System",
      details: JSON.stringify({ type: data.type, partyB: data.partyBName }),
    },
  });

  return contract;
}

export async function getContractById(id: string) {
  return prisma.contract.findUnique({
    where: { id },
    include: {
      signingRequests: { orderBy: { signingOrder: "asc" } },
      fillableFields: true,
      auditTrail: { orderBy: { timestamp: "desc" } },
    },
  });
}

export async function sendForSigning(
  contractId: string,
  data: {
    signerEmail: string;
    signerName: string;
    signerRole: string;
    verificationMethod: string;
    expiresInDays?: number;
  }
) {
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays ?? 7));

  const existingRequests = await prisma.contractSigningRequest.count({
    where: { contractId },
  });

  const request = await prisma.contractSigningRequest.create({
    data: {
      contractId,
      signerEmail: data.signerEmail,
      signerName: data.signerName,
      signerRole: data.signerRole,
      signingOrder: existingRequests + 1,
      accessToken: token,
      accessUrl: `/signing/${token}`,
      status: "PENDING",
      sentAt: new Date(),
      verificationMethod: data.verificationMethod as "BANK_ID" | "MOJE_ID" | "E_CITIZEN" | "SMS_OTP" | "NONE",
      expiresAt,
    },
  });

  // Update contract status
  await prisma.contract.update({
    where: { id: contractId },
    data: { status: "PENDING_SIGNATURE" },
  });

  // Audit
  await prisma.contractAuditEntry.create({
    data: {
      contractId,
      action: "SENT",
      actor: "System",
      details: JSON.stringify({
        to: data.signerEmail,
        role: data.signerRole,
        method: data.verificationMethod,
        token,
      }),
    },
  });

  return request;
}

export async function getSigningData(token: string) {
  const request = await prisma.contractSigningRequest.findUnique({
    where: { accessToken: token },
    include: {
      contract: {
        include: { fillableFields: true },
      },
    },
  });

  if (!request) return null;
  if (new Date() > request.expiresAt) return null;

  // Mark as viewed
  if (!request.viewedAt) {
    await prisma.contractSigningRequest.update({
      where: { id: request.id },
      data: { viewedAt: new Date(), status: "VIEWED" },
    });
    await prisma.contractAuditEntry.create({
      data: {
        contractId: request.contractId,
        action: "VIEWED",
        actor: request.signerEmail,
      },
    });
  }

  return request;
}

export async function fillContractFields(
  token: string,
  fields: Array<{ fieldName: string; value: string }>
) {
  const request = await prisma.contractSigningRequest.findUnique({
    where: { accessToken: token },
    include: { contract: { include: { fillableFields: true } } },
  });

  if (!request) throw new Error("Neplatný odkaz");

  for (const field of fields) {
    const existing = request.contract.fillableFields.find(
      (f) => f.fieldName === field.fieldName
    );
    if (existing) {
      await prisma.contractFillableField.update({
        where: { id: existing.id },
        data: {
          filledValue: field.value,
          filledAt: new Date(),
          filledBy: request.signerEmail,
        },
      });
    }
  }

  await prisma.contractSigningRequest.update({
    where: { id: request.id },
    data: { status: "FIELDS_FILLED" },
  });

  await prisma.contractAuditEntry.create({
    data: {
      contractId: request.contractId,
      action: "FIELD_FILLED",
      actor: request.signerEmail,
      details: JSON.stringify(fields.map((f) => f.fieldName)),
    },
  });
}

export async function verifyBankId(
  token: string,
  data: {
    bankIdProvider: string;
    bankIdTransactionId: string;
    verifiedName: string;
    idCardNumber: string;
    idCardType: string;
    secondIdNumber?: string;
    secondIdType?: string;
  }
) {
  const request = await prisma.contractSigningRequest.findUnique({
    where: { accessToken: token },
  });
  if (!request) throw new Error("Neplatný odkaz");

  await prisma.contractSigningRequest.update({
    where: { id: request.id },
    data: {
      bankIdVerified: true,
      bankIdProvider: data.bankIdProvider,
      bankIdTransactionId: data.bankIdTransactionId,
      bankIdVerifiedAt: new Date(),
      bankIdVerifiedName: data.verifiedName,
      idCardNumber: data.idCardNumber,
      idCardType: data.idCardType,
      secondIdNumber: data.secondIdNumber,
      secondIdType: data.secondIdType,
      status: "IDENTITY_VERIFIED",
    },
  });

  await prisma.contractAuditEntry.create({
    data: {
      contractId: request.contractId,
      action: "IDENTITY_VERIFIED",
      actor: request.signerEmail,
      details: JSON.stringify({
        method: "BANK_ID",
        provider: data.bankIdProvider,
        verifiedName: data.verifiedName,
      }),
    },
  });
}

export async function signContract(
  token: string,
  data: {
    signatureData: string;
    signatureType: string;
    signerIp?: string;
    signerUserAgent?: string;
  }
) {
  const request = await prisma.contractSigningRequest.findUnique({
    where: { accessToken: token },
    include: { contract: true },
  });
  if (!request) throw new Error("Neplatný odkaz");

  // Generate hash of signed content
  const contentToHash = `${request.contract.htmlContent ?? ""}|${request.signerEmail}|${new Date().toISOString()}`;
  const signatureHash = crypto.createHash("sha256").update(contentToHash).digest("hex");

  await prisma.contractSigningRequest.update({
    where: { id: request.id },
    data: {
      status: "SIGNED",
      signedAt: new Date(),
      signatureType: data.signatureType as "SIMPLE" | "ADVANCED" | "QUALIFIED",
      signatureData: data.signatureData,
      signatureHash,
      signerIp: data.signerIp,
      signerUserAgent: data.signerUserAgent,
    },
  });

  // Check if all signing requests are signed
  const allRequests = await prisma.contractSigningRequest.findMany({
    where: { contractId: request.contractId },
  });
  const allSigned = allRequests.every((r) => r.status === "SIGNED");

  if (allSigned) {
    await prisma.contract.update({
      where: { id: request.contractId },
      data: { status: "SIGNED" },
    });
  } else {
    await prisma.contract.update({
      where: { id: request.contractId },
      data: { status: "PARTIALLY_SIGNED" },
    });
  }

  await prisma.contractAuditEntry.create({
    data: {
      contractId: request.contractId,
      action: "SIGNED",
      actor: request.signerEmail,
      actorIp: data.signerIp,
      actorAgent: data.signerUserAgent,
      details: JSON.stringify({
        signatureType: data.signatureType,
        signatureHash,
        bankIdVerified: request.bankIdVerified,
      }),
    },
  });
}

export async function getContractTypes() {
  return [
    { value: "EMPLOYMENT_HPP", label: "Pracovní smlouva (HPP)" },
    { value: "EMPLOYMENT_DPP", label: "Dohoda o provedení práce (DPP)" },
    { value: "EMPLOYMENT_DPC", label: "Dohoda o pracovní činnosti (DPČ)" },
    { value: "EMPLOYMENT_SOD", label: "Smlouva o dílo (SoD)" },
    { value: "EMPLOYMENT_RS", label: "Rámcová smlouva" },
    { value: "SUBCONTRACTOR", label: "Smlouva se subdodavatelem" },
    { value: "NDA", label: "Dohoda o mlčenlivosti (NDA)" },
    { value: "SERVICE", label: "Smlouva o poskytování služeb" },
    { value: "LEASE", label: "Nájemní smlouva" },
    { value: "OTHER", label: "Jiná smlouva" },
  ];
}

export async function renderContractHtml(contract: {
  htmlContent?: string | null;
  partyAName?: string | null;
  partyBName?: string | null;
  partyAIco?: string | null;
  partyBIco?: string | null;
  partyADic?: string | null;
  partyBDic?: string | null;
  partyAAddress?: string | null;
  partyBAddress?: string | null;
  partyARepresentative?: string | null;
  partyBRepresentative?: string | null;
  totalAmount?: number | bigint | null;
  validFrom?: Date | string | null;
  validTo?: Date | string | null;
  contractNumber?: string | null;
  fillableFields?: Array<{ fieldName: string; filledValue?: string | null }>;
}): Promise<string> {
  let html = contract.htmlContent ?? "";

  const replacements: Record<string, string> = {
    "{{partyAName}}": contract.partyAName ?? "",
    "{{partyBName}}": contract.partyBName ?? "",
    "{{partyAIco}}": contract.partyAIco ?? "",
    "{{partyBIco}}": contract.partyBIco ?? "",
    "{{partyADic}}": contract.partyADic ?? "",
    "{{partyBDic}}": contract.partyBDic ?? "",
    "{{partyAAddress}}": contract.partyAAddress ?? "",
    "{{partyBAddress}}": contract.partyBAddress ?? "",
    "{{partyARepresentative}}": contract.partyARepresentative ?? "",
    "{{partyBRepresentative}}": contract.partyBRepresentative ?? "",
    "{{totalAmount}}": contract.totalAmount ? Number(contract.totalAmount).toLocaleString("cs-CZ") : "",
    "{{validFrom}}": contract.validFrom ? new Date(contract.validFrom).toLocaleDateString("cs-CZ") : "",
    "{{validTo}}": contract.validTo ? new Date(contract.validTo).toLocaleDateString("cs-CZ") : "",
    "{{contractNumber}}": contract.contractNumber ?? "",
  };

  for (const [placeholder, value] of Object.entries(replacements)) {
    html = html.replaceAll(placeholder, value);
  }

  // Replace {{field:name:label:type}} with filled values or placeholder
  html = html.replace(/\{\{field:(\w+):([^:]+):(\w+)\}\}/g, (_match, fieldName, label) => {
    const field = contract.fillableFields?.find((f) => f.fieldName === fieldName);
    if (field?.filledValue) return `<strong>${field.filledValue}</strong>`;
    return `[${label}]`;
  });

  return html;
}

export async function getContractStats() {
  const [total, pending, signed, expired] = await Promise.all([
    prisma.contract.count(),
    prisma.contract.count({ where: { status: { in: ["PENDING_SIGNATURE", "PARTIALLY_SIGNED", "PENDING_FIELDS"] } } }),
    prisma.contract.count({ where: { status: "SIGNED" } }),
    prisma.contract.count({ where: { status: "EXPIRED" } }),
  ]);
  return { total, pending, signed, expired };
}
