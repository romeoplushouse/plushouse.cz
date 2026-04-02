"use server";

import { prisma } from "@/lib/prisma";

// ============================================================================
// Kniha jízd (Vehicle Trip Logbook) - Czech legal requirement
// ============================================================================

export async function getTrips(
  filter?: {
    employeeId?: string;
    vehicleId?: string;
    purpose?: string;
    dateFrom?: string;
    dateTo?: string;
  },
  page = 1,
  pageSize = 20
) {
  const where: Record<string, unknown> = {};
  if (filter?.employeeId) where.employeeId = filter.employeeId;
  if (filter?.vehicleId) where.vehicleId = filter.vehicleId;
  if (filter?.dateFrom || filter?.dateTo) {
    where.startDate = {
      ...(filter.dateFrom ? { gte: new Date(filter.dateFrom) } : {}),
      ...(filter.dateTo ? { lte: new Date(filter.dateTo) } : {}),
    };
  }

  const skip = (page - 1) * pageSize;
  const [trips, total] = await Promise.all([
    prisma.workTrip.findMany({
      where,
      include: { employee: true },
      orderBy: { startDate: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.workTrip.count({ where }),
  ]);

  return { trips, total, pages: Math.ceil(total / pageSize) };
}

export async function createTrip(data: {
  employeeId: string;
  vehicleId?: string;
  purpose: string;
  startLocation: string;
  endLocation: string;
  startDate: string;
  endDate?: string;
  distanceKm: number;
  avgSpeedKmh?: number;
  maxSpeedKmh?: number;
  hardBrakeCount?: number;
  fuelCost?: number;
  otherCosts?: number;
  notes?: string;
  isPersonal?: boolean;
}) {
  // Calculate meal allowance (stravné) based on duration
  let mealAllowance = 0;
  if (data.endDate) {
    const hours =
      (new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) /
      3600000;
    // Czech meal allowance rates 2026
    if (hours >= 18) mealAllowance = 344;
    else if (hours >= 12) mealAllowance = 227;
    else if (hours >= 5) mealAllowance = 150;
  }

  return prisma.workTrip.create({
    data: {
      employeeId: data.employeeId,
      vehicleId: data.vehicleId,
      purpose: data.isPersonal ? "OSOBNÍ: " + data.purpose : data.purpose,
      startLocation: data.startLocation,
      endLocation: data.endLocation,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      distanceKm: data.distanceKm,
      avgSpeedKmh: data.avgSpeedKmh,
      maxSpeedKmh: data.maxSpeedKmh,
      hardBrakeCount: data.hardBrakeCount ?? 0,
      fuelCost: data.fuelCost,
      otherCosts: data.otherCosts,
      mealAllowance,
      notes: data.notes,
      status: "DRAFT",
    },
    include: { employee: true },
  });
}

export async function getTripById(id: string) {
  return prisma.workTrip.findUnique({
    where: { id },
    include: { employee: true },
  });
}

export async function updateTripStatus(
  id: string,
  status: "DRAFT" | "SUBMITTED" | "APPROVED"
) {
  return prisma.workTrip.update({
    where: { id },
    data: { status },
  });
}

export async function deleteTrip(id: string) {
  return prisma.workTrip.delete({ where: { id } });
}

export async function getTripStats(
  dateFrom?: string,
  dateTo?: string,
  employeeId?: string
) {
  const where: Record<string, unknown> = {};
  if (employeeId) where.employeeId = employeeId;
  if (dateFrom || dateTo) {
    where.startDate = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }

  const trips = await prisma.workTrip.findMany({ where });

  const businessTrips = trips.filter(
    (t) => !t.purpose.startsWith("OSOBNÍ:")
  );
  const personalTrips = trips.filter((t) =>
    t.purpose.startsWith("OSOBNÍ:")
  );

  const totalKm = trips.reduce((sum, t) => sum + Number(t.distanceKm), 0);
  const businessKm = businessTrips.reduce(
    (sum, t) => sum + Number(t.distanceKm),
    0
  );
  const personalKm = personalTrips.reduce(
    (sum, t) => sum + Number(t.distanceKm),
    0
  );
  const totalFuel = trips.reduce(
    (sum, t) => sum + Number(t.fuelCost ?? 0),
    0
  );
  const totalMeal = trips.reduce(
    (sum, t) => sum + Number(t.mealAllowance ?? 0),
    0
  );
  const totalOther = trips.reduce(
    (sum, t) => sum + Number(t.otherCosts ?? 0),
    0
  );

  // Czech tax deduction rate per km (2026)
  const kmRate = 5.6; // Kč/km for personal car
  const taxDeduction = businessKm * kmRate;

  return {
    totalTrips: trips.length,
    businessTrips: businessTrips.length,
    personalTrips: personalTrips.length,
    totalKm: Math.round(totalKm * 10) / 10,
    businessKm: Math.round(businessKm * 10) / 10,
    personalKm: Math.round(personalKm * 10) / 10,
    totalFuel: Math.round(totalFuel * 100) / 100,
    totalMeal: Math.round(totalMeal * 100) / 100,
    totalOther: Math.round(totalOther * 100) / 100,
    totalCosts: Math.round((totalFuel + totalMeal + totalOther) * 100) / 100,
    taxDeduction: Math.round(taxDeduction * 100) / 100,
    kmRate,
  };
}

export async function getGpsTrack(employeeId: string, date: string) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  return prisma.locationLog.findMany({
    where: {
      employeeId,
      timestamp: { gte: dayStart, lte: dayEnd },
    },
    orderBy: { timestamp: "asc" },
    select: {
      lat: true,
      lng: true,
      speed: true,
      altitude: true,
      accuracy: true,
      timestamp: true,
    },
  });
}

export async function exportTripsToCsv(
  dateFrom: string,
  dateTo: string,
  employeeId?: string
) {
  const where: Record<string, unknown> = {
    startDate: {
      gte: new Date(dateFrom),
      lte: new Date(dateTo),
    },
  };
  if (employeeId) where.employeeId = employeeId;

  const trips = await prisma.workTrip.findMany({
    where,
    include: { employee: true },
    orderBy: { startDate: "asc" },
  });

  const header =
    "Datum;Řidič;Odkud;Kam;Účel;Km;Služební/Osobní;Stravné;PHM;Stav";
  const rows = trips.map((t) => {
    const isPersonal = t.purpose.startsWith("OSOBNÍ:");
    const purpose = isPersonal
      ? t.purpose.replace("OSOBNÍ: ", "")
      : t.purpose;
    return [
      new Date(t.startDate).toLocaleDateString("cs-CZ"),
      `${t.employee.firstName} ${t.employee.lastName}`,
      t.startLocation,
      t.endLocation,
      purpose,
      Number(t.distanceKm).toFixed(1),
      isPersonal ? "Osobní" : "Služební",
      Number(t.mealAllowance ?? 0).toFixed(0),
      Number(t.fuelCost ?? 0).toFixed(0),
      t.status === "APPROVED"
        ? "Schváleno"
        : t.status === "SUBMITTED"
          ? "Odesláno"
          : "Koncept",
    ].join(";");
  });

  return [header, ...rows].join("\n");
}
