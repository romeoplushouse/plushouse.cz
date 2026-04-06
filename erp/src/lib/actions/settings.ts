"use server";

import { prisma } from "@/lib/prisma";

export async function getOrganization() {
  return prisma.organization.findFirst();
}

export async function saveOrganization(data: {
  name: string;
  ico?: string;
  dic?: string;
  street?: string;
  city?: string;
  zip?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  bankAccount?: string;
  bankCode?: string;
  registrationNote?: string;
}) {
  const existing = await prisma.organization.findFirst();
  if (existing) {
    return prisma.organization.update({
      where: { id: existing.id },
      data,
    });
  }
  return prisma.organization.create({ data });
}

export async function getVehicles() {
  return prisma.vehicle.findMany({
    where: { isActive: true },
    orderBy: { licensePlate: "asc" },
  });
}

export async function createVehicle(data: {
  licensePlate: string;
  make: string;
  model: string;
  year?: number;
  vin?: string;
  fuelType?: string;
  personalUseAllowed?: boolean;
  geofenceRegion?: string;
}) {
  return prisma.vehicle.create({ data });
}

export async function getLocationLogs(
  employeeId: string,
  dateFrom?: string,
  dateTo?: string
) {
  return prisma.locationLog.findMany({
    where: {
      employeeId,
      ...(dateFrom || dateTo
        ? {
            timestamp: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo ? { lte: new Date(dateTo) } : {}),
            },
          }
        : {}),
    },
    orderBy: { timestamp: "desc" },
    take: 200,
  });
}

export async function getSosAlerts(resolved?: boolean) {
  return prisma.sosAlert.findMany({
    where: resolved !== undefined ? { isResolved: resolved } : {},
    include: { employee: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function resolveSosAlert(id: string, resolvedBy: string) {
  return prisma.sosAlert.update({
    where: { id },
    data: { isResolved: true, resolvedAt: new Date(), resolvedBy },
  });
}

export async function getGeofenceAlerts(reviewed?: boolean) {
  return prisma.geofenceAlert.findMany({
    where: reviewed !== undefined ? { isReviewed: reviewed } : {},
    include: { vehicle: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function createWorkTrip(data: {
  employeeId: string;
  vehicleId?: string;
  purpose: string;
  startLocation: string;
  endLocation: string;
  startDate: string;
  endDate?: string;
  distanceKm: number;
  hardBrakeCount?: number;
  fuelCost?: number;
  otherCosts?: number;
  notes?: string;
}) {
  // Calculate meal allowance (stravné) based on trip duration
  let mealAllowance = 0;
  if (data.endDate) {
    const hours =
      (new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) /
      3600000;
    // Czech meal allowance rates 2026 (approximate)
    if (hours >= 18) mealAllowance = 344;
    else if (hours >= 12) mealAllowance = 227;
    else if (hours >= 5) mealAllowance = 150;
  }

  return prisma.workTrip.create({
    data: {
      employeeId: data.employeeId,
      vehicleId: data.vehicleId,
      purpose: data.purpose,
      startLocation: data.startLocation,
      endLocation: data.endLocation,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      distanceKm: data.distanceKm,
      hardBrakeCount: data.hardBrakeCount ?? 0,
      fuelCost: data.fuelCost,
      otherCosts: data.otherCosts,
      mealAllowance,
      notes: data.notes,
    },
  });
}

export async function getWorkTrips(employeeId: string) {
  return prisma.workTrip.findMany({
    where: { employeeId },
    orderBy: { startDate: "desc" },
    take: 50,
  });
}

export async function getDashboardStats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    unpaidInvoices,
    incomeThisMonth,
    expensesThisMonth,
    activeProjects,
    activeEmployees,
    totalContacts,
    overdueInvoices,
    recentPayments,
  ] = await Promise.all([
    prisma.invoice.count({
      where: { type: "ISSUED", status: { in: ["SENT", "PARTIALLY_PAID"] } },
    }),
    prisma.payment.aggregate({
      where: {
        type: "INCOMING",
        date: { gte: monthStart },
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        type: "OUTGOING",
        date: { gte: monthStart },
      },
      _sum: { amount: true },
    }),
    prisma.project.count({
      where: { status: "IN_PROGRESS" },
    }),
    prisma.employee.count({ where: { isActive: true } }),
    prisma.contact.count({ where: { isActive: true } }),
    prisma.invoice.count({ where: { status: "OVERDUE" } }),
    prisma.payment.findMany({
      include: { invoice: true, contact: true },
      orderBy: { date: "desc" },
      take: 5,
    }),
  ]);

  return {
    unpaidInvoices,
    incomeThisMonth: Number(incomeThisMonth._sum.amount ?? 0),
    expensesThisMonth: Number(expensesThisMonth._sum.amount ?? 0),
    activeProjects,
    activeEmployees,
    totalContacts,
    overdueInvoices,
    recentPayments,
  };
}
