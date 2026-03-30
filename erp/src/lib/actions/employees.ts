"use server";

import { prisma } from "@/lib/prisma";

export async function getEmployees(page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize;
  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where: { isActive: true },
      orderBy: { lastName: "asc" },
      skip,
      take: pageSize,
    }),
    prisma.employee.count({ where: { isActive: true } }),
  ]);
  return { employees, total, pages: Math.ceil(total / pageSize) };
}

export async function createEmployee(data: {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  hireDate: string;
  hourlyRate?: number;
  monthlySalary?: number;
  bankAccount?: string;
  street?: string;
  city?: string;
  zip?: string;
}) {
  const count = await prisma.employee.count();
  const employeeNumber = `EMP-${String(count + 1).padStart(4, "0")}`;

  return prisma.employee.create({
    data: {
      employeeNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      position: data.position,
      department: data.department,
      hireDate: new Date(data.hireDate),
      hourlyRate: data.hourlyRate,
      monthlySalary: data.monthlySalary,
      bankAccount: data.bankAccount,
      street: data.street,
      city: data.city,
      zip: data.zip,
    },
  });
}

export async function getEmployeeById(id: string) {
  return prisma.employee.findUnique({
    where: { id },
    include: {
      payrolls: { orderBy: { period: "desc" }, take: 12 },
      locationLogs: { orderBy: { timestamp: "desc" }, take: 50 },
      workTrips: { orderBy: { startDate: "desc" }, take: 20 },
      vehicleUsages: { include: { vehicle: true }, take: 20 },
      craftRatings: { orderBy: { ratedAt: "desc" }, take: 10 },
      sosAlerts: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
}

export async function updateEmployee(
  id: string,
  data: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    position: string;
    department: string;
    hourlyRate: number;
    monthlySalary: number;
    bankAccount: string;
    isActive: boolean;
    street: string;
    city: string;
    zip: string;
  }>
) {
  return prisma.employee.update({ where: { id }, data });
}

export async function terminateEmployee(id: string) {
  return prisma.employee.update({
    where: { id },
    data: { isActive: false, terminationDate: new Date() },
  });
}

export async function calculatePayroll(employeeId: string, period: string) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) throw new Error("Zaměstnanec nenalezen");

  const gross = Number(employee.monthlySalary ?? 0);

  // Czech payroll calculations (2026 rates)
  const healthInsEmployee = Math.round(gross * 0.045 * 100) / 100; // 4.5%
  const socialInsEmployee = Math.round(gross * 0.065 * 100) / 100; // 6.5%
  const healthInsEmployer = Math.round(gross * 0.09 * 100) / 100; // 9%
  const socialInsEmployer = Math.round(gross * 0.248 * 100) / 100; // 24.8%

  const taxBase = gross; // Simplified - superhrubá mzda was abolished
  const incomeTax = Math.round(taxBase * 0.15 * 100) / 100; // 15% (simplified)
  const taxDeduction = 2570; // Základní sleva na poplatníka (monthly)
  const finalTax = Math.max(0, incomeTax - taxDeduction);

  const deductions = healthInsEmployee + socialInsEmployee + finalTax;
  const netSalary = Math.round((gross - deductions) * 100) / 100;

  return prisma.payroll.upsert({
    where: {
      employeeId_period: { employeeId, period },
    },
    update: {
      grossSalary: gross,
      healthInsurance: healthInsEmployee,
      socialInsurance: socialInsEmployee,
      incomeTax: finalTax,
      netSalary,
      status: "DRAFT",
    },
    create: {
      employeeId,
      period,
      grossSalary: gross,
      healthInsurance: healthInsEmployee,
      socialInsurance: socialInsEmployee,
      incomeTax: finalTax,
      deductions: 0,
      bonuses: 0,
      netSalary,
      status: "DRAFT",
    },
  });
}

export async function getPayrolls(period: string) {
  return prisma.payroll.findMany({
    where: { period },
    include: { employee: true },
    orderBy: { employee: { lastName: "asc" } },
  });
}

export async function approvePayroll(id: string) {
  return prisma.payroll.update({
    where: { id },
    data: { status: "APPROVED" },
  });
}

export async function calculateAllPayrolls(period: string) {
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
  });

  const results = [];
  for (const emp of employees) {
    const payroll = await calculatePayroll(emp.id, period);
    results.push(payroll);
  }
  return results;
}
