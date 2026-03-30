"use server";

import { prisma } from "@/lib/prisma";
import { generateDocumentNumber } from "@/lib/utils";

export async function getProjects(
  filter?: { status?: string },
  page = 1,
  pageSize = 20
) {
  const where: Record<string, unknown> = {};
  if (filter?.status) where.status = filter.status;

  const skip = (page - 1) * pageSize;
  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        contact: true,
        tasks: { orderBy: { createdAt: "desc" }, take: 5 },
        projectWorkers: {
          include: { employee: true, subcontractor: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.project.count({ where }),
  ]);

  return { projects, total, pages: Math.ceil(total / pageSize) };
}

export async function createProject(data: {
  name: string;
  description?: string;
  contactId?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  address?: string;
  lat?: number;
  lng?: number;
}) {
  const year = new Date().getFullYear();
  const count = await prisma.project.count({
    where: { projectNumber: { startsWith: `ZAK-${year}` } },
  });
  const projectNumber = generateDocumentNumber("ZAK", year, count + 1);

  return prisma.project.create({
    data: {
      projectNumber,
      name: data.name,
      description: data.description,
      contactId: data.contactId,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      budget: data.budget,
      address: data.address,
      lat: data.lat,
      lng: data.lng,
    },
  });
}

export async function addProjectTask(
  projectId: string,
  data: {
    title: string;
    description?: string;
    assigneeId?: string;
    dueDate?: string;
    priority?: number;
  }
) {
  return prisma.projectTask.create({
    data: {
      projectId,
      title: data.title,
      description: data.description,
      assigneeId: data.assigneeId,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      priority: data.priority ?? 0,
    },
  });
}

export async function addMediaEvidence(
  projectId: string,
  data: {
    type: "PHOTO" | "VIDEO";
    phase?: string;
    url: string;
    thumbnailUrl?: string;
    description?: string;
    uploadedBy?: string;
  }
) {
  return prisma.mediaEvidence.create({
    data: { projectId, ...data },
  });
}

export async function addQualityCheck(
  projectId: string,
  data: {
    inspectorId?: string;
    score?: number;
    notes?: string;
    items: Array<{
      criteria: string;
      passed: boolean;
      notes?: string;
      severity?: string;
    }>;
  }
) {
  return prisma.qualityCheck.create({
    data: {
      projectId,
      inspectorId: data.inspectorId,
      score: data.score,
      notes: data.notes,
      items: { create: data.items },
    },
    include: { items: true },
  });
}

export async function addProjectMaterial(
  projectId: string,
  data: {
    materialId?: string;
    name: string;
    quantity: number;
    unit?: string;
    unitCost: number;
    supplierId?: string;
    invoiceRef?: string;
  }
) {
  return prisma.projectMaterial.create({
    data: {
      projectId,
      materialId: data.materialId,
      name: data.name,
      quantity: data.quantity,
      unit: data.unit ?? "ks",
      unitCost: data.unitCost,
      totalCost: data.quantity * data.unitCost,
      supplierId: data.supplierId,
      invoiceRef: data.invoiceRef,
    },
  });
}

export async function getProjectStats() {
  const [newCount, inProgressCount, onHoldCount, completedCount] =
    await Promise.all([
      prisma.project.count({ where: { status: "NEW" } }),
      prisma.project.count({ where: { status: "IN_PROGRESS" } }),
      prisma.project.count({ where: { status: "ON_HOLD" } }),
      prisma.project.count({ where: { status: "COMPLETED" } }),
    ]);

  return {
    new: newCount,
    inProgress: inProgressCount,
    onHold: onHoldCount,
    completed: completedCount,
  };
}
