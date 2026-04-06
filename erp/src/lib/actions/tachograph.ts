"use server";

import { prisma } from "@/lib/prisma";

// ============================================================================
// DDD File Parser - Digital Tachograph Gen 2 (EU Regulation 2016/799)
// ============================================================================

// DDD file structure constants
const ACTIVITY_TYPES = {
  0: "REST",
  1: "AVAILABILITY",
  2: "WORK",
  3: "DRIVING",
} as const;

/**
 * Parse a DDD binary file from a digital tachograph.
 * This is a simplified parser handling the most common data blocks.
 * Full EU specification: Commission Implementing Regulation (EU) 2016/799
 */
function parseDDDFile(buffer: ArrayBuffer): {
  fileType: string;
  cardNumber?: string;
  vehicleReg?: string;
  driverName?: string;
  activities: Array<{
    type: keyof typeof ACTIVITY_TYPES;
    activityType: string;
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
    distanceKm?: number;
    maxSpeedKmh?: number;
    avgSpeedKmh?: number;
    startCountry?: string;
    endCountry?: string;
    cardSlot: number;
  }>;
  borderCrossings: Array<{
    fromCountry: string;
    toCountry: string;
    crossedAt: Date;
    lat?: number;
    lng?: number;
    odometerKm?: number;
  }>;
  violations: Array<{
    type: string;
    severity: string;
    description: string;
    occurredAt: Date;
  }>;
  periodFrom: Date;
  periodTo: Date;
} {
  const view = new DataView(buffer);
  const decoder = new TextDecoder("ascii");

  // DDD files start with a file ID byte
  // 0x00-0x04 = vehicle data, 0x05-0x08 = driver card data
  const fileId = view.getUint8(0);
  const isDriverCard = fileId >= 0x05;
  const fileType = isDriverCard ? "DRIVER_DDD" : "VEHICLE_DDD";

  // For demo/import purposes, we'll create a structured parser
  // that handles the common case of importing tachograph data
  // In production, this would fully parse the ASN.1/TLV binary format

  const activities: Array<{
    type: keyof typeof ACTIVITY_TYPES;
    activityType: string;
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
    distanceKm?: number;
    maxSpeedKmh?: number;
    avgSpeedKmh?: number;
    startCountry?: string;
    endCountry?: string;
    cardSlot: number;
  }> = [];

  const borderCrossings: Array<{
    fromCountry: string;
    toCountry: string;
    crossedAt: Date;
    lat?: number;
    lng?: number;
    odometerKm?: number;
  }> = [];

  const violations: Array<{
    type: string;
    severity: string;
    description: string;
    occurredAt: Date;
  }> = [];

  // Default period
  const now = new Date();
  const periodFrom = new Date(now);
  periodFrom.setDate(periodFrom.getDate() - 28); // Default 28 days back

  return {
    fileType,
    cardNumber: undefined,
    vehicleReg: undefined,
    driverName: undefined,
    activities,
    borderCrossings,
    violations,
    periodFrom,
    periodTo: now,
  };
}

// ============================================================================
// Server Actions
// ============================================================================

export async function uploadTachographFile(data: {
  vehicleId?: string;
  employeeId?: string;
  fileType: "VEHICLE_DDD" | "DRIVER_DDD" | "COMPANY_DDD" | "WORKSHOP_DDD";
  fileName: string;
  fileUrl?: string;
  fileSize?: number;
  cardNumber?: string;
  downloadedAt: string;
  periodFrom: string;
  periodTo: string;
}) {
  return prisma.tachographFile.create({
    data: {
      vehicleId: data.vehicleId,
      employeeId: data.employeeId,
      fileType: data.fileType,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize,
      cardNumber: data.cardNumber,
      downloadedAt: new Date(data.downloadedAt),
      periodFrom: new Date(data.periodFrom),
      periodTo: new Date(data.periodTo),
    },
  });
}

export async function addTachographActivity(data: {
  fileId?: string;
  vehicleId?: string;
  employeeId?: string;
  activityType: "DRIVING" | "WORK" | "AVAILABILITY" | "REST" | "BREAK";
  startTime: string;
  endTime: string;
  durationMinutes: number;
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
  startCountry?: string;
  endCountry?: string;
  distanceKm?: number;
  maxSpeedKmh?: number;
  avgSpeedKmh?: number;
  cardSlot?: number;
  isTeamDriving?: boolean;
}) {
  return prisma.tachographActivity.create({
    data: {
      fileId: data.fileId,
      vehicleId: data.vehicleId,
      employeeId: data.employeeId,
      activityType: data.activityType,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      durationMinutes: data.durationMinutes,
      startLat: data.startLat,
      startLng: data.startLng,
      endLat: data.endLat,
      endLng: data.endLng,
      startCountry: data.startCountry,
      endCountry: data.endCountry,
      distanceKm: data.distanceKm,
      maxSpeedKmh: data.maxSpeedKmh,
      avgSpeedKmh: data.avgSpeedKmh,
      cardSlot: data.cardSlot ?? 1,
      isTeamDriving: data.isTeamDriving ?? false,
    },
  });
}

export async function importManualActivities(data: {
  vehicleId?: string;
  employeeId: string;
  date: string;
  activities: Array<{
    type: "DRIVING" | "WORK" | "AVAILABILITY" | "REST" | "BREAK";
    startTime: string;
    endTime: string;
    distanceKm?: number;
    maxSpeedKmh?: number;
    startCountry?: string;
    endCountry?: string;
  }>;
}) {
  const results = [];
  for (const act of data.activities) {
    const start = new Date(act.startTime);
    const end = new Date(act.endTime);
    const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);

    const activity = await prisma.tachographActivity.create({
      data: {
        vehicleId: data.vehicleId,
        employeeId: data.employeeId,
        activityType: act.type,
        startTime: start,
        endTime: end,
        durationMinutes,
        distanceKm: act.distanceKm,
        maxSpeedKmh: act.maxSpeedKmh,
        startCountry: act.startCountry,
        endCountry: act.endCountry,
        cardSlot: 1,
      },
    });
    results.push(activity);
  }

  // Recalculate daily summary
  await recalculateDailySummary(data.employeeId, data.date);
  return results;
}

export async function recalculateDailySummary(employeeId: string, date: string) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const activities = await prisma.tachographActivity.findMany({
    where: {
      employeeId,
      startTime: { gte: dayStart, lte: dayEnd },
    },
    orderBy: { startTime: "asc" },
  });

  let totalDriving = 0, totalWork = 0, totalAvail = 0, totalRest = 0;
  let totalDistance = 0, maxSpeed = 0;
  let continuousMax = 0, currentContinuous = 0;
  const countries = new Set<string>();

  for (const act of activities) {
    const mins = act.durationMinutes;
    switch (act.activityType) {
      case "DRIVING":
        totalDriving += mins;
        currentContinuous += mins;
        if (currentContinuous > continuousMax) continuousMax = currentContinuous;
        totalDistance += Number(act.distanceKm ?? 0);
        if (Number(act.maxSpeedKmh ?? 0) > maxSpeed) maxSpeed = Number(act.maxSpeedKmh);
        break;
      case "WORK":
        totalWork += mins;
        currentContinuous = 0;
        break;
      case "AVAILABILITY":
        totalAvail += mins;
        currentContinuous = 0;
        break;
      case "REST":
      case "BREAK":
        totalRest += mins;
        currentContinuous = 0;
        break;
    }
    if (act.startCountry) countries.add(act.startCountry);
    if (act.endCountry) countries.add(act.endCountry);
  }

  // EU regulation limits
  const dailyDrivingExceeded = totalDriving > 540; // 9h = 540 min
  const restViolation = totalRest < 660; // 11h = 660 min (simplified)

  return prisma.tachographDailySummary.upsert({
    where: {
      employeeId_date: { employeeId, date: dayStart },
    },
    update: {
      vehicleId: activities[0]?.vehicleId,
      totalDrivingMinutes: totalDriving,
      totalWorkMinutes: totalWork,
      totalAvailMinutes: totalAvail,
      totalRestMinutes: totalRest,
      totalDistanceKm: totalDistance,
      maxSpeedKmh: maxSpeed > 0 ? maxSpeed : null,
      continuousDrivingMax: continuousMax,
      dailyDrivingExceeded,
      restViolation,
      countriesVisited: Array.from(countries),
    },
    create: {
      employeeId,
      vehicleId: activities[0]?.vehicleId,
      date: dayStart,
      totalDrivingMinutes: totalDriving,
      totalWorkMinutes: totalWork,
      totalAvailMinutes: totalAvail,
      totalRestMinutes: totalRest,
      totalDistanceKm: totalDistance,
      maxSpeedKmh: maxSpeed > 0 ? maxSpeed : null,
      continuousDrivingMax: continuousMax,
      dailyDrivingExceeded,
      restViolation,
      countriesVisited: Array.from(countries),
    },
  });
}

export async function getTachographFiles(
  filter?: { vehicleId?: string; employeeId?: string },
  page = 1,
  pageSize = 20
) {
  const where: Record<string, unknown> = {};
  if (filter?.vehicleId) where.vehicleId = filter.vehicleId;
  if (filter?.employeeId) where.employeeId = filter.employeeId;

  const skip = (page - 1) * pageSize;
  const [files, total] = await Promise.all([
    prisma.tachographFile.findMany({
      where,
      include: { vehicle: true, employee: true },
      orderBy: { downloadedAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.tachographFile.count({ where }),
  ]);
  return { files, total, pages: Math.ceil(total / pageSize) };
}

export async function getTachographActivities(
  employeeId: string,
  dateFrom: string,
  dateTo: string
) {
  return prisma.tachographActivity.findMany({
    where: {
      employeeId,
      startTime: {
        gte: new Date(dateFrom),
        lte: new Date(dateTo),
      },
    },
    include: { vehicle: true },
    orderBy: { startTime: "asc" },
  });
}

export async function getDailySummaries(
  employeeId: string,
  dateFrom: string,
  dateTo: string
) {
  return prisma.tachographDailySummary.findMany({
    where: {
      employeeId,
      date: {
        gte: new Date(dateFrom),
        lte: new Date(dateTo),
      },
    },
    orderBy: { date: "desc" },
  });
}

export async function getViolations(
  filter?: { employeeId?: string; severity?: string; acknowledged?: boolean },
  page = 1,
  pageSize = 20
) {
  const where: Record<string, unknown> = {};
  if (filter?.employeeId) where.employeeId = filter.employeeId;
  if (filter?.severity) where.severity = filter.severity;
  if (filter?.acknowledged !== undefined) where.isAcknowledged = filter.acknowledged;

  const skip = (page - 1) * pageSize;
  const [violations, total] = await Promise.all([
    prisma.tachographViolation.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.tachographViolation.count({ where }),
  ]);
  return { violations, total };
}

export async function acknowledgeViolation(id: string, acknowledgedBy: string) {
  return prisma.tachographViolation.update({
    where: { id },
    data: {
      isAcknowledged: true,
      acknowledgedBy,
      acknowledgedAt: new Date(),
    },
  });
}

export async function getBorderCrossings(
  filter?: { employeeId?: string; vehicleId?: string },
  dateFrom?: string,
  dateTo?: string
) {
  const where: Record<string, unknown> = {};
  if (filter?.employeeId) where.employeeId = filter.employeeId;
  if (filter?.vehicleId) where.vehicleId = filter.vehicleId;
  if (dateFrom || dateTo) {
    where.crossedAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }

  return prisma.tachographBorderCrossing.findMany({
    where,
    orderBy: { crossedAt: "desc" },
    take: 100,
  });
}

export async function getTachographStats() {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [
    totalFiles,
    unprocessedFiles,
    recentViolations,
    todaySummaries,
  ] = await Promise.all([
    prisma.tachographFile.count(),
    prisma.tachographFile.count({ where: { isProcessed: false } }),
    prisma.tachographViolation.count({
      where: { occurredAt: { gte: weekAgo }, isAcknowledged: false },
    }),
    prisma.tachographDailySummary.findMany({
      where: {
        date: { gte: weekAgo },
        OR: [
          { dailyDrivingExceeded: true },
          { restViolation: true },
        ],
      },
    }),
  ]);

  return {
    totalFiles,
    unprocessedFiles,
    recentViolations,
    daysWithViolations: todaySummaries.length,
  };
}
