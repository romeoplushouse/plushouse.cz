"use server";

import { prisma } from "@/lib/prisma";

export async function getContacts(
  filter?: { type?: string },
  page = 1,
  pageSize = 20
) {
  const where: Record<string, unknown> = { isActive: true };
  if (filter?.type) where.type = filter.type;

  const skip = (page - 1) * pageSize;
  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: {
        contactPersons: true,
        tags: true,
        subcontractor: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.contact.count({ where }),
  ]);

  return { contacts, total, pages: Math.ceil(total / pageSize) };
}

export async function createContact(data: {
  type: "CUSTOMER" | "SUPPLIER" | "SUBCONTRACTOR" | "EMPLOYEE_CONTACT" | "OTHER";
  companyName?: string;
  firstName?: string;
  lastName?: string;
  ico?: string;
  dic?: string;
  street?: string;
  city?: string;
  zip?: string;
  country?: string;
  email?: string;
  phone?: string;
  website?: string;
  bankAccount?: string;
  bankCode?: string;
  notes?: string;
}) {
  return prisma.contact.create({ data });
}

export async function updateContact(id: string, data: Partial<{
  companyName: string;
  firstName: string;
  lastName: string;
  ico: string;
  dic: string;
  street: string;
  city: string;
  zip: string;
  email: string;
  phone: string;
  website: string;
  bankAccount: string;
  notes: string;
}>) {
  return prisma.contact.update({ where: { id }, data });
}

export async function getContactById(id: string) {
  return prisma.contact.findUnique({
    where: { id },
    include: {
      contactPersons: true,
      tags: true,
      issuedInvoices: { orderBy: { issueDate: "desc" }, take: 10 },
      receivedInvoices: { orderBy: { issueDate: "desc" }, take: 10 },
      projects: { orderBy: { createdAt: "desc" }, take: 10 },
      payments: { orderBy: { date: "desc" }, take: 10 },
      communications: { orderBy: { date: "desc" }, take: 20 },
      subcontractor: {
        include: { priceListItems: true },
      },
    },
  });
}

export async function getContactStats() {
  const [customers, suppliers, subcontractors] = await Promise.all([
    prisma.contact.count({ where: { type: "CUSTOMER", isActive: true } }),
    prisma.contact.count({ where: { type: "SUPPLIER", isActive: true } }),
    prisma.contact.count({ where: { type: "SUBCONTRACTOR", isActive: true } }),
  ]);

  return { customers, suppliers, subcontractors };
}

export async function deleteContact(id: string) {
  return prisma.contact.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function searchContacts(query: string) {
  return prisma.contact.findMany({
    where: {
      isActive: true,
      OR: [
        { companyName: { contains: query, mode: "insensitive" } },
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { ico: { contains: query } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 10,
    orderBy: { companyName: "asc" },
  });
}
