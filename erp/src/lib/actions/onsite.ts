"use server";

import { prisma } from "@/lib/prisma";
import { generateDocumentNumber } from "@/lib/utils";
import { revalidatePath } from "next/cache";

// ============================================================================
// WORK SESSIONS
// ============================================================================

export async function checkIn(data: {
  projectId: string;
  employeeId?: string;
  subcontractorId?: string;
  lat?: number;
  lng?: number;
  isAutoCheckin?: boolean;
}) {
  const session = await prisma.workSession.create({
    data: {
      projectId: data.projectId,
      employeeId: data.employeeId,
      subcontractorId: data.subcontractorId,
      checkInTime: new Date(),
      checkInLat: data.lat,
      checkInLng: data.lng,
      isAutoCheckin: data.isAutoCheckin ?? false,
      status: "ACTIVE",
    },
  });

  revalidatePath(`/zakazky/${data.projectId}/prace`);
  return session;
}

export async function checkOut(
  sessionId: string,
  data: {
    lat?: number;
    lng?: number;
    workDescription?: string;
    steps?: number;
    distanceWalked?: number;
    avgHeartRate?: number;
    caloriesBurned?: number;
  }
) {
  const session = await prisma.workSession.findUnique({
    where: { id: sessionId },
  });
  if (!session) throw new Error("Pracovní relace nenalezena");

  const checkOutTime = new Date();
  const durationMs = checkOutTime.getTime() - session.checkInTime.getTime();
  const durationMinutes = Math.round(durationMs / 60000) - session.breakMinutes;

  const updated = await prisma.workSession.update({
    where: { id: sessionId },
    data: {
      checkOutTime,
      checkOutLat: data.lat,
      checkOutLng: data.lng,
      workDescription: data.workDescription,
      steps: data.steps,
      distanceWalked: data.distanceWalked,
      avgHeartRate: data.avgHeartRate,
      caloriesBurned: data.caloriesBurned,
      durationMinutes,
      status: "COMPLETED",
    },
  });

  revalidatePath(`/zakazky/${session.projectId}/prace`);
  return updated;
}

export async function addBreak(sessionId: string, minutes: number) {
  const session = await prisma.workSession.findUnique({
    where: { id: sessionId },
  });
  if (!session) throw new Error("Pracovní relace nenalezena");

  const updated = await prisma.workSession.update({
    where: { id: sessionId },
    data: {
      breakMinutes: session.breakMinutes + minutes,
    },
  });

  revalidatePath(`/zakazky/${session.projectId}/prace`);
  return updated;
}

export async function getActiveSession(employeeId: string) {
  return prisma.workSession.findFirst({
    where: {
      employeeId,
      checkOutTime: null,
      status: "ACTIVE",
    },
    include: {
      checklistItems: true,
    },
    orderBy: { checkInTime: "desc" },
  });
}

export async function getWorkSessions(filters?: {
  projectId?: string;
  employeeId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const where: Record<string, unknown> = {};
  if (filters?.projectId) where.projectId = filters.projectId;
  if (filters?.employeeId) where.employeeId = filters.employeeId;
  if (filters?.dateFrom || filters?.dateTo) {
    where.checkInTime = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
    };
  }

  return prisma.workSession.findMany({
    where,
    include: { checklistItems: true },
    orderBy: { checkInTime: "desc" },
  });
}

// ============================================================================
// WORK SESSION CHECKLISTS
// ============================================================================

export async function addChecklistItem(sessionId: string, item: string) {
  const created = await prisma.workSessionChecklist.create({
    data: {
      workSessionId: sessionId,
      item,
    },
  });

  // Recalculate checklist score
  await recalculateChecklistScore(sessionId);
  return created;
}

export async function completeChecklistItem(itemId: string, photoUrl?: string) {
  const item = await prisma.workSessionChecklist.update({
    where: { id: itemId },
    data: {
      isCompleted: true,
      completedAt: new Date(),
      photoUrl,
    },
  });

  await recalculateChecklistScore(item.workSessionId);
  return item;
}

async function recalculateChecklistScore(sessionId: string) {
  const items = await prisma.workSessionChecklist.findMany({
    where: { workSessionId: sessionId },
  });
  if (items.length === 0) return;

  const completed = items.filter((i) => i.isCompleted).length;
  const score = (completed / items.length) * 100;

  await prisma.workSession.update({
    where: { id: sessionId },
    data: { checklistScore: score },
  });
}

export function calculateSessionDuration(session: {
  checkInTime: Date | string;
  checkOutTime?: Date | string | null;
  breakMinutes: number;
}): number {
  const checkIn = new Date(session.checkInTime);
  const checkOut = session.checkOutTime
    ? new Date(session.checkOutTime)
    : new Date();
  const durationMs = checkOut.getTime() - checkIn.getTime();
  return Math.max(0, Math.round(durationMs / 60000) - session.breakMinutes);
}

// ============================================================================
// HANDOVER PROTOCOLS
// ============================================================================

export async function createHandoverProtocol(data: {
  projectId: string;
  type: string;
  handedOverBy: string;
  receivedBy: string;
  description: string;
  items?: string;
  defects?: string;
  conditions?: string;
}) {
  const year = new Date().getFullYear();

  const prefixMap: Record<string, string> = {
    HANDOVER: "PP",
    DELIVERY: "DL",
    SERVICE: "SP",
    REVISION: "RZ",
    ACCEPTANCE: "PO",
  };
  const prefix = prefixMap[data.type] || "PP";

  const count = await prisma.handoverProtocol.count({
    where: {
      protocolNumber: { startsWith: `${prefix}-${year}` },
    },
  });
  const protocolNumber = generateDocumentNumber(prefix, year, count + 1);

  const protocol = await prisma.handoverProtocol.create({
    data: {
      projectId: data.projectId,
      protocolNumber,
      type: data.type as "HANDOVER" | "DELIVERY" | "SERVICE" | "REVISION" | "ACCEPTANCE",
      handedOverBy: data.handedOverBy,
      receivedBy: data.receivedBy,
      description: data.description,
      items: data.items,
      defects: data.defects,
      conditions: data.conditions,
      status: "DRAFT",
    },
  });

  revalidatePath(`/zakazky/${data.projectId}/protokoly`);
  return protocol;
}

export async function signProtocol(
  id: string,
  data: {
    handoverSignature?: string;
    receiverSignature?: string;
  }
) {
  const updateData: Record<string, unknown> = {};
  if (data.handoverSignature)
    updateData.handoverSignature = data.handoverSignature;
  if (data.receiverSignature)
    updateData.receiverSignature = data.receiverSignature;

  // If both signatures are present, mark as signed
  const existing = await prisma.handoverProtocol.findUnique({
    where: { id },
  });
  if (!existing) throw new Error("Protokol nenalezen");

  const willHaveBoth =
    (data.handoverSignature || existing.handoverSignature) &&
    (data.receiverSignature || existing.receiverSignature);

  if (willHaveBoth) {
    updateData.status = "SIGNED";
    updateData.signedAt = new Date();
  }

  const protocol = await prisma.handoverProtocol.update({
    where: { id },
    data: updateData,
  });

  revalidatePath(`/zakazky/${existing.projectId}/protokoly`);
  return protocol;
}

export async function getProtocols(projectId?: string) {
  const where: Record<string, unknown> = {};
  if (projectId) where.projectId = projectId;

  return prisma.handoverProtocol.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

// ============================================================================
// ON-SITE PAYMENTS
// ============================================================================

export async function recordOnSitePayment(data: {
  projectId?: string;
  invoiceId?: string;
  amount: number;
  method: string;
  cardLast4?: string;
  transactionId?: string;
  lat?: number;
  lng?: number;
  collectedBy?: string;
}) {
  const payment = await prisma.onSitePayment.create({
    data: {
      projectId: data.projectId,
      invoiceId: data.invoiceId,
      amount: data.amount,
      method: data.method as
        | "NFC_TAP_TO_PAY"
        | "CARD_READER"
        | "QR_CODE"
        | "CASH"
        | "BANK_TRANSFER",
      cardLast4: data.cardLast4,
      transactionId: data.transactionId,
      lat: data.lat,
      lng: data.lng,
      collectedBy: data.collectedBy,
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  if (data.projectId) {
    revalidatePath(`/zakazky/${data.projectId}/protokoly`);
  }
  return payment;
}

export async function getOnSitePayments(projectId?: string) {
  const where: Record<string, unknown> = {};
  if (projectId) where.projectId = projectId;

  return prisma.onSitePayment.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}
