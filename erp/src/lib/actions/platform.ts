"use server";

import { prisma } from "@/lib/prisma";

// ============================================================================
// Cross-Platform Integration: ERP ↔ PlusConnect ↔ PlusHouse
// Propojení všech služeb do jednoho ekosystému
// ============================================================================

// User's unified profile across all platforms
export async function getUnifiedUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      employee: true,
    },
  });

  if (!user) return null;

  // Get all related data
  const [
    contracts,
    invoicesIssued,
    invoicesReceived,
    payments,
    projects,
  ] = await Promise.all([
    prisma.contract.findMany({
      where: {
        OR: [
          { employeeId: user.employee?.id },
          { contactId: { not: null } },
        ],
        status: "SIGNED",
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.invoice.findMany({
      where: { status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] } },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    prisma.invoice.findMany({
      where: { status: "OVERDUE" },
      orderBy: { dueDate: "asc" },
    }),
    prisma.payment.findMany({
      orderBy: { date: "desc" },
      take: 10,
    }),
    prisma.project.findMany({
      where: { status: "IN_PROGRESS" },
      include: { contact: true },
      take: 10,
    }),
  ]);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
    stats: {
      activeContracts: contracts.length,
      unpaidInvoices: invoicesIssued.length,
      overdueInvoices: invoicesReceived.length,
      activeProjects: projects.length,
    },
    recentContracts: contracts.map((c) => ({
      id: c.id,
      number: c.contractNumber,
      title: c.title,
      type: c.type,
      status: c.status,
      partyB: c.partyBName,
      validFrom: c.validFrom?.toISOString(),
      validTo: c.validTo?.toISOString(),
    })),
    unpaidInvoices: invoicesIssued.map((inv) => ({
      id: inv.id,
      number: inv.invoiceNumber,
      total: Number(inv.total),
      paid: Number(inv.paidAmount),
      remaining: Number(inv.total) - Number(inv.paidAmount),
      dueDate: inv.dueDate.toISOString(),
      isOverdue: inv.status === "OVERDUE",
      daysOverdue: inv.status === "OVERDUE"
        ? Math.floor((Date.now() - inv.dueDate.getTime()) / 86400000)
        : 0,
    })),
    activeProjects: projects.map((p) => ({
      id: p.id,
      number: p.projectNumber,
      name: p.name,
      status: p.status,
      client: p.contact?.companyName || p.contact?.firstName,
    })),
    platforms: {
      erp: { url: "https://erp.plushouse.cz", active: true },
      plusconnect: { url: "https://plusconnect.cz", active: true },
      plushouse: { url: "https://plushouse.cz", active: true },
    },
  };
}

// Get overdue invoices for reminder notifications
export async function getOverdueReminders() {
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: "OVERDUE",
      type: "ISSUED",
    },
    include: { customer: true },
    orderBy: { dueDate: "asc" },
  });

  return overdueInvoices.map((inv) => {
    const daysOverdue = Math.floor(
      (Date.now() - inv.dueDate.getTime()) / 86400000
    );

    let urgency: "low" | "medium" | "high" | "critical";
    if (daysOverdue <= 7) urgency = "low";
    else if (daysOverdue <= 14) urgency = "medium";
    else if (daysOverdue <= 30) urgency = "high";
    else urgency = "critical";

    return {
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customer?.companyName || inv.customer?.firstName || "Neznámý",
      customerEmail: inv.customer?.email,
      amount: Number(inv.total),
      paidAmount: Number(inv.paidAmount),
      remaining: Number(inv.total) - Number(inv.paidAmount),
      dueDate: inv.dueDate.toISOString(),
      daysOverdue,
      urgency,
      reminderMessage: getReminderMessage(daysOverdue, inv.invoiceNumber, Number(inv.total) - Number(inv.paidAmount)),
    };
  });
}

function getReminderMessage(days: number, invoiceNumber: string, amount: number): string {
  const amtStr = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK" }).format(amount);

  if (days <= 3) {
    return `Dobrý den, dovolujeme si Vás upozornit, že faktura ${invoiceNumber} ve výši ${amtStr} je po splatnosti. Prosíme o brzkou úhradu.`;
  }
  if (days <= 14) {
    return `Dobrý den, faktura ${invoiceNumber} ve výši ${amtStr} je ${days} dní po splatnosti. Prosíme o neprodlenou úhradu.`;
  }
  if (days <= 30) {
    return `Dobrý den, faktura ${invoiceNumber} ve výši ${amtStr} je ${days} dní po splatnosti. Jedná se o druhou upomínku. Neobdržíme-li platbu do 7 dnů, budeme nuceni přistoupit k dalším krokům.`;
  }
  return `Dobrý den, faktura ${invoiceNumber} ve výši ${amtStr} je ${days} dní po splatnosti. Jedná se o třetí a poslední upomínku před předáním pohledávky k vymáhání.`;
}

// Client portal data (what a client sees when logged in)
export async function getClientPortalOverview(contactId: string) {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: {
      issuedInvoices: {
        orderBy: { issueDate: "desc" },
        take: 20,
      },
      projects: {
        include: {
          tasks: { where: { status: { not: "CANCELLED" } } },
          qualityChecks: true,
          mediaEvidence: { take: 5 },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!contact) return null;

  // Get contracts for this contact
  const contracts = await prisma.contract.findMany({
    where: { contactId },
    orderBy: { createdAt: "desc" },
  });

  // Get client reviews
  const reviews = await prisma.clientReview.findMany({
    where: { contactId },
  });

  // Membership info (from notes or custom fields)
  const activeMemberships = contracts.filter(
    (c) => c.status === "SIGNED" && c.validTo && new Date(c.validTo) > new Date()
  );

  return {
    contact: {
      id: contact.id,
      name: contact.companyName || `${contact.firstName} ${contact.lastName}`,
      email: contact.email,
      phone: contact.phone,
    },
    invoices: contact.issuedInvoices.map((inv) => ({
      id: inv.id,
      number: inv.invoiceNumber,
      type: inv.type,
      issueDate: inv.issueDate.toISOString(),
      dueDate: inv.dueDate.toISOString(),
      total: Number(inv.total),
      paidAmount: Number(inv.paidAmount),
      status: inv.status,
      qrCode: inv.qrPaymentCode,
    })),
    projects: contact.projects.map((p) => ({
      id: p.id,
      number: p.projectNumber,
      name: p.name,
      status: p.status,
      taskCount: p.tasks.length,
      tasksDone: p.tasks.filter((t) => t.status === "DONE").length,
      qualityScore: p.qualityChecks.length > 0
        ? p.qualityChecks.reduce((sum, qc) => sum + (qc.score ?? 0), 0) / p.qualityChecks.length
        : null,
      photos: p.mediaEvidence.map((m) => m.url),
    })),
    contracts: contracts.map((c) => ({
      id: c.id,
      number: c.contractNumber,
      title: c.title,
      type: c.type,
      status: c.status,
      validFrom: c.validFrom?.toISOString(),
      validTo: c.validTo?.toISOString(),
    })),
    activeMemberships: activeMemberships.length,
    reviewsGiven: reviews.length,
    pendingReviews: contact.projects.filter(
      (p) => p.status === "COMPLETED" && !reviews.find((r) => r.projectId === p.id)
    ).map((p) => ({
      projectId: p.id,
      projectName: p.name,
    })),
  };
}

// API endpoint data for PlusConnect integration
export async function getPlusConnectSyncData(userId: string) {
  const profile = await getUnifiedUserProfile(userId);
  if (!profile) return null;

  const reminders = await getOverdueReminders();

  return {
    user: profile.user,
    notifications: [
      ...reminders.map((r) => ({
        type: "invoice_overdue" as const,
        title: `Faktura ${r.invoiceNumber} po splatnosti`,
        message: `${r.daysOverdue} dní, ${new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK" }).format(r.remaining)}`,
        urgency: r.urgency,
        actionUrl: `https://erp.plushouse.cz/faktury/${r.invoiceId}`,
        date: r.dueDate,
      })),
      ...profile.activeProjects.map((p) => ({
        type: "project_active" as const,
        title: `Zakázka ${p.number}: ${p.name}`,
        message: `Stav: ${p.status}`,
        urgency: "low" as const,
        actionUrl: `https://erp.plushouse.cz/zakazky/${p.id}`,
        date: new Date().toISOString(),
      })),
    ],
    quickLinks: [
      { label: "ERP Dashboard", url: "https://erp.plushouse.cz", icon: "layout-dashboard" },
      { label: "Nová faktura", url: "https://erp.plushouse.cz/faktury/nova", icon: "file-text" },
      { label: "Nový kontakt", url: "https://erp.plushouse.cz/crm/novy", icon: "user-plus" },
      { label: "Nová zakázka", url: "https://erp.plushouse.cz/zakazky/nova", icon: "folder-kanban" },
    ],
  };
}
