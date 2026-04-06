"use server";

import { prisma } from "@/lib/prisma";

// ============================================================================
// Analýza obchodních partnerů
// - Spolehlivost plátce DPH (Finanční správa)
// - Insolvence (ISIR - Insolvenční rejstřík)
// - Exekuce (CERD)
// - Účetní závěrka z justice.cz (OR)
// - Interní scoring (platební morálka, plnění termínů)
// ============================================================================

// Czech public API endpoints
const ARES_URL = "https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty";
const VAT_RELIABILITY_URL = "https://adisrws.mfcr.cz/dpr/api/v1/nesp";
const ISIR_URL = "https://isir.justice.cz/isir/ws/v1";
const JUSTICE_URL = "https://or.justice.cz/ias/ui/rejstrik-$firma";

// ============================================================================
// ARES - Administrativní registr ekonomických subjektů
// ============================================================================

export async function lookupARES(ico: string): Promise<{
  name?: string;
  ico?: string;
  dic?: string;
  address?: string;
  city?: string;
  zip?: string;
  legalForm?: string;
  dateEstablished?: string;
  nace?: string[];
  error?: string;
}> {
  try {
    const res = await fetch(`${ARES_URL}/${ico}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 }, // Cache 24h
    });

    if (!res.ok) {
      return { error: `ARES: Subjekt s IČO ${ico} nenalezen` };
    }

    const data = await res.json();
    return {
      name: data.obchodniJmeno,
      ico: data.ico,
      dic: data.dic,
      address: data.sidlo?.textovaAdresa,
      city: data.sidlo?.nazevObce,
      zip: data.sidlo?.psc?.toString(),
      legalForm: data.pravniForma?.nazev,
      dateEstablished: data.datumVzniku,
      nace: data.czNace?.map((n: { kod: string; nazev: string }) => `${n.kod} - ${n.nazev}`),
    };
  } catch {
    return { error: "Nepodařilo se připojit k ARES" };
  }
}

// ============================================================================
// Spolehlivost plátce DPH - Finanční správa ČR
// ============================================================================

export async function checkVatReliability(dic: string): Promise<{
  isReliable: boolean | null;
  unreliableSince?: string;
  publishedAccounts?: string[];
  error?: string;
}> {
  try {
    // Check if DIČ is in the list of unreliable VAT payers
    const cleanDic = dic.replace(/^CZ/, "");
    const res = await fetch(`${VAT_RELIABILITY_URL}/${cleanDic}`, {
      next: { revalidate: 3600 }, // Cache 1h
    });

    if (res.status === 404) {
      return { isReliable: true }; // Not in unreliable list = reliable
    }

    if (!res.ok) {
      // Try alternative approach - check via MFCR API
      return { isReliable: null, error: "Nelze ověřit - API nedostupné" };
    }

    const data = await res.json();
    return {
      isReliable: false,
      unreliableSince: data.datumZverejneni,
      publishedAccounts: data.zverejneneUcty?.map(
        (u: { cisloUctu: string; kodBanky: string }) => `${u.cisloUctu}/${u.kodBanky}`
      ),
    };
  } catch {
    return { isReliable: null, error: "Nepodařilo se připojit k Finanční správě" };
  }
}

// ============================================================================
// Insolvence - ISIR (Insolvenční rejstřík)
// ============================================================================

export async function checkInsolvency(ico: string): Promise<{
  hasInsolvency: boolean;
  records: Array<{
    caseNumber: string;
    status: string;
    date: string;
    court: string;
  }>;
  error?: string;
}> {
  try {
    const res = await fetch(
      `${ISIR_URL}/hledani?ico=${ico}&rows=10`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return { hasInsolvency: false, records: [], error: "ISIR API nedostupné" };
    }

    const data = await res.json();
    const records = (data.data || []).map(
      (r: { spisovaZnacka: string; stav: string; datumVydani: string; soud: string }) => ({
        caseNumber: r.spisovaZnacka,
        status: r.stav,
        date: r.datumVydani,
        court: r.soud,
      })
    );

    return {
      hasInsolvency: records.length > 0,
      records,
    };
  } catch {
    return { hasInsolvency: false, records: [], error: "Nepodařilo se připojit k ISIR" };
  }
}

// ============================================================================
// Exekuce - CERD (Centrální evidence rozhodnutí a exekučních titulů)
// ============================================================================

export async function checkExecutions(ico: string): Promise<{
  hasExecutions: boolean;
  count: number;
  note: string;
  error?: string;
}> {
  // CERD nemá veřejné API - upozorníme uživatele na ruční kontrolu
  // V produkci by se napojilo na placené API (např. CRIBIS, Bisnode)
  return {
    hasExecutions: false,
    count: 0,
    note: "Automatická kontrola exekucí vyžaduje napojení na CERD/CRIBIS. Pro ruční kontrolu navštivte cedr.mfcr.cz",
  };
}

// ============================================================================
// Justice.cz - Účetní závěrky ze sbírky listin
// ============================================================================

export async function getFinancialStatements(ico: string): Promise<{
  available: boolean;
  statements: Array<{
    year: number;
    revenue?: number;
    profit?: number;
    assets?: number;
    equity?: number;
    liabilities?: number;
    employees?: number;
    source: string;
  }>;
  justiceUrl: string;
  error?: string;
}> {
  const justiceUrl = `https://or.justice.cz/ias/ui/rejstrik-$firma?ico=${ico}`;

  try {
    // Try to fetch from justice.cz OR API
    // Note: justice.cz doesn't have a public REST API for financial statements
    // In production, use a paid service like Bisnode, CRIBIS, or scrape the PDF documents
    const res = await fetch(
      `https://or.justice.cz/ias/ui/rejstrik-$firma?jenPlatworke=PLATNY&ico=${ico}&typHledani=STAV_SUBJEKTU`,
      { next: { revalidate: 86400 } }
    );

    // We can't reliably parse justice.cz HTML, so we return the URL
    // and note that it requires manual review or a paid API
    return {
      available: false,
      statements: [],
      justiceUrl,
      error: "Automatické stahování účetních závěrek vyžaduje napojení na placené API (CRIBIS/Bisnode). Odkaz na sbírku listin je níže.",
    };
  } catch {
    return {
      available: false,
      statements: [],
      justiceUrl,
      error: "Nepodařilo se připojit k justice.cz",
    };
  }
}

// ============================================================================
// Interní scoring - platební morálka a plnění termínů
// ============================================================================

export async function calculatePartnerScore(contactId: string): Promise<{
  overallScore: number; // 0-100
  grade: "A" | "B" | "C" | "D" | "F";
  metrics: {
    paymentOnTime: number; // % faktur zaplacených včas
    avgPaymentDelay: number; // průměrné zpoždění ve dnech
    totalInvoiced: number; // celkem fakturováno
    totalPaid: number; // celkem zaplaceno
    unpaidAmount: number; // neuhrazeno
    overdueAmount: number; // po splatnosti
    invoiceCount: number; // počet faktur
    paidCount: number; // zaplaceno
    overdueCount: number; // po splatnosti
    avgInvoiceValue: number; // průměrná hodnota faktury
    longestDelay: number; // nejdelší zpoždění
    projectsCompleted: number; // dokončené zakázky
    projectsTotal: number; // celkem zakázek
    communicationCount: number; // počet komunikací
    lastPaymentDate: string | null;
    lastInvoiceDate: string | null;
    relationshipDays: number; // délka obchodního vztahu
  };
  recommendations: string[];
}> {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: {
      issuedInvoices: true,
      receivedInvoices: true,
      projects: true,
      payments: { orderBy: { date: "desc" } },
      communications: true,
    },
  });

  if (!contact) {
    return {
      overallScore: 0,
      grade: "F",
      metrics: {
        paymentOnTime: 0, avgPaymentDelay: 0, totalInvoiced: 0, totalPaid: 0,
        unpaidAmount: 0, overdueAmount: 0, invoiceCount: 0, paidCount: 0,
        overdueCount: 0, avgInvoiceValue: 0, longestDelay: 0,
        projectsCompleted: 0, projectsTotal: 0, communicationCount: 0,
        lastPaymentDate: null, lastInvoiceDate: null, relationshipDays: 0,
      },
      recommendations: ["Kontakt nenalezen"],
    };
  }

  // Combine all invoices (issued to customer or received from supplier)
  const allInvoices = [...contact.issuedInvoices, ...contact.receivedInvoices];

  const invoiceCount = allInvoices.length;
  const paidInvoices = allInvoices.filter((i) => i.status === "PAID");
  const overdueInvoices = allInvoices.filter((i) => i.status === "OVERDUE");
  const paidCount = paidInvoices.length;
  const overdueCount = overdueInvoices.length;

  const totalInvoiced = allInvoices.reduce((s, i) => s + Number(i.total), 0);
  const totalPaid = allInvoices.reduce((s, i) => s + Number(i.paidAmount), 0);
  const unpaidAmount = totalInvoiced - totalPaid;
  const overdueAmount = overdueInvoices.reduce((s, i) => s + Number(i.total) - Number(i.paidAmount), 0);

  // Calculate payment delays
  let totalDelay = 0;
  let onTimeCount = 0;
  let longestDelay = 0;

  for (const inv of paidInvoices) {
    if (inv.paidAt && inv.dueDate) {
      const delay = Math.max(
        0,
        Math.floor(
          (new Date(inv.paidAt).getTime() - new Date(inv.dueDate).getTime()) /
            86400000
        )
      );
      totalDelay += delay;
      if (delay <= 0) onTimeCount++;
      if (delay > longestDelay) longestDelay = delay;
    }
  }

  const avgPaymentDelay = paidCount > 0 ? Math.round(totalDelay / paidCount) : 0;
  const paymentOnTime = paidCount > 0 ? Math.round((onTimeCount / paidCount) * 100) : 100;

  const avgInvoiceValue = invoiceCount > 0 ? totalInvoiced / invoiceCount : 0;

  const projectsCompleted = contact.projects.filter((p) => p.status === "COMPLETED").length;
  const projectsTotal = contact.projects.length;
  const communicationCount = contact.communications.length;

  const lastPaymentDate = contact.payments[0]?.date?.toISOString() ?? null;
  const lastInvoice = allInvoices.sort(
    (a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
  )[0];
  const lastInvoiceDate = lastInvoice?.issueDate?.toISOString() ?? null;

  const relationshipDays = Math.floor(
    (Date.now() - new Date(contact.createdAt).getTime()) / 86400000
  );

  // Calculate score (0-100)
  let score = 50; // Base score

  // Payment on time bonus (max +30)
  score += Math.min(30, paymentOnTime * 0.3);

  // Payment delay penalty (max -20)
  score -= Math.min(20, avgPaymentDelay * 2);

  // Overdue penalty (max -25)
  if (invoiceCount > 0) {
    const overdueRatio = overdueCount / invoiceCount;
    score -= Math.min(25, overdueRatio * 50);
  }

  // Relationship length bonus (max +10)
  score += Math.min(10, relationshipDays / 365 * 5);

  // Communication bonus (max +5)
  score += Math.min(5, communicationCount * 0.5);

  // Volume bonus (max +5)
  if (totalInvoiced > 100000) score += 2;
  if (totalInvoiced > 500000) score += 3;

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Grade
  let grade: "A" | "B" | "C" | "D" | "F";
  if (score >= 85) grade = "A";
  else if (score >= 70) grade = "B";
  else if (score >= 55) grade = "C";
  else if (score >= 40) grade = "D";
  else grade = "F";

  // Recommendations
  const recommendations: string[] = [];
  if (overdueCount > 0) {
    recommendations.push(`${overdueCount} faktur po splatnosti - zvažte upomínku nebo pozastavení dodávek`);
  }
  if (avgPaymentDelay > 14) {
    recommendations.push(`Průměrné zpoždění plateb ${avgPaymentDelay} dní - zkraťte splatnost nebo požadujte zálohu`);
  }
  if (paymentOnTime < 50) {
    recommendations.push("Méně než 50 % faktur zaplaceno včas - zvýšené riziko");
  }
  if (communicationCount === 0) {
    recommendations.push("Žádná zaznamenaná komunikace - zaznamenejte kontakty s partnerem");
  }
  if (score >= 85) {
    recommendations.push("Vynikající partner - zvažte prodloužení splatnosti nebo objemové slevy");
  }
  if (invoiceCount === 0) {
    recommendations.push("Zatím žádné faktury - nový partner, nedostatek dat pro hodnocení");
  }

  return {
    overallScore: score,
    grade,
    metrics: {
      paymentOnTime,
      avgPaymentDelay,
      totalInvoiced: Math.round(totalInvoiced),
      totalPaid: Math.round(totalPaid),
      unpaidAmount: Math.round(unpaidAmount),
      overdueAmount: Math.round(overdueAmount),
      invoiceCount,
      paidCount,
      overdueCount,
      avgInvoiceValue: Math.round(avgInvoiceValue),
      longestDelay,
      projectsCompleted,
      projectsTotal,
      communicationCount,
      lastPaymentDate,
      lastInvoiceDate,
      relationshipDays,
    },
    recommendations,
  };
}

// ============================================================================
// Kompletní analýza partnera (kombinuje vše)
// ============================================================================

export async function runFullAnalysis(contactId: string) {
  const contact = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!contact) throw new Error("Kontakt nenalezen");

  const results: {
    ares: Awaited<ReturnType<typeof lookupARES>> | null;
    vatReliability: Awaited<ReturnType<typeof checkVatReliability>> | null;
    insolvency: Awaited<ReturnType<typeof checkInsolvency>> | null;
    executions: Awaited<ReturnType<typeof checkExecutions>> | null;
    financials: Awaited<ReturnType<typeof getFinancialStatements>> | null;
    scoring: Awaited<ReturnType<typeof calculatePartnerScore>>;
  } = {
    ares: null,
    vatReliability: null,
    insolvency: null,
    executions: null,
    financials: null,
    scoring: await calculatePartnerScore(contactId),
  };

  if (contact.ico) {
    const [ares, insolvency, executions, financials] = await Promise.all([
      lookupARES(contact.ico),
      checkInsolvency(contact.ico),
      checkExecutions(contact.ico),
      getFinancialStatements(contact.ico),
    ]);
    results.ares = ares;
    results.insolvency = insolvency;
    results.executions = executions;
    results.financials = financials;
  }

  if (contact.dic) {
    results.vatReliability = await checkVatReliability(contact.dic);
  }

  return results;
}
