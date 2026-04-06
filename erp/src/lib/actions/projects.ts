"use server";

import { prisma } from "@/lib/prisma";
import { generateDocumentNumber } from "@/lib/utils";
import { revalidatePath } from "next/cache";

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

  const project = await prisma.project.create({
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
  revalidatePath("/zakazky");
  return project;
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
  const task = await prisma.projectTask.create({
    data: {
      projectId,
      title: data.title,
      description: data.description,
      assigneeId: data.assigneeId,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      priority: data.priority ?? 0,
    },
  });
  revalidatePath(`/zakazky/${projectId}`);
  return task;
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
  const media = await prisma.mediaEvidence.create({
    data: { projectId, ...data },
  });
  revalidatePath(`/zakazky/${projectId}`);
  return media;
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
  const check = await prisma.qualityCheck.create({
    data: {
      projectId,
      inspectorId: data.inspectorId,
      score: data.score,
      notes: data.notes,
      items: { create: data.items },
    },
    include: { items: true },
  });
  revalidatePath(`/zakazky/${projectId}`);
  return check;
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
  const material = await prisma.projectMaterial.create({
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
  revalidatePath(`/zakazky/${projectId}`);
  return material;
}

export async function getProjectById(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      contact: true,
      tasks: {
        orderBy: { createdAt: "desc" },
        include: { assignee: true },
      },
      materials: { orderBy: { date: "desc" } },
      mediaEvidence: { orderBy: { uploadedAt: "desc" } },
      qualityChecks: {
        orderBy: { checkDate: "desc" },
        include: { items: true },
      },
      projectWorkers: {
        include: { employee: true, subcontractor: { include: { contact: true } } },
      },
      invoices: { orderBy: { issueDate: "desc" }, take: 10 },
    },
  });
}

export async function updateProjectStatus(
  id: string,
  status: "NEW" | "QUOTED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED"
) {
  const project = await prisma.project.update({
    where: { id },
    data: { status },
  });
  revalidatePath(`/zakazky/${id}`);
  revalidatePath("/zakazky");
  return project;
}

export async function updateTaskStatus(
  taskId: string,
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "CANCELLED"
) {
  const task = await prisma.projectTask.update({
    where: { id: taskId },
    data: {
      status,
      completedAt: status === "DONE" ? new Date() : null,
    },
    include: { project: { select: { id: true } } },
  });
  revalidatePath(`/zakazky/${task.project.id}`);
  return task;
}

export async function addProjectWorker(
  projectId: string,
  data: {
    employeeId?: string;
    subcontractorId?: string;
    role?: string;
  }
) {
  const worker = await prisma.projectWorker.create({
    data: {
      projectId,
      employeeId: data.employeeId || null,
      subcontractorId: data.subcontractorId || null,
      role: data.role,
    },
    include: { employee: true, subcontractor: { include: { contact: true } } },
  });
  revalidatePath(`/zakazky/${projectId}`);
  return worker;
}

export async function removeProjectWorker(id: string) {
  const worker = await prisma.projectWorker.delete({
    where: { id },
    include: { project: { select: { id: true } } },
  });
  revalidatePath(`/zakazky/${worker.project.id}`);
  return worker;
}

export async function getEmployees() {
  return prisma.employee.findMany({
    where: { isActive: true },
    orderBy: { lastName: "asc" },
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
