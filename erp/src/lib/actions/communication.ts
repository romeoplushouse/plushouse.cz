"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

// ============================================================================
// PROJECT MESSAGES
// ============================================================================

export async function getProjectMessages(projectId: string, page = 1, pageSize = 50) {
  const skip = (page - 1) * pageSize;
  const [messages, total] = await Promise.all([
    prisma.projectMessage.findMany({
      where: { projectId },
      include: {
        attachments: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.projectMessage.count({ where: { projectId } }),
  ]);

  return { messages, total, pages: Math.ceil(total / pageSize) };
}

export async function sendProjectMessage(data: {
  projectId: string;
  authorName: string;
  authorRole: string;
  content: string;
  isInternal?: boolean;
}) {
  const message = await prisma.projectMessage.create({
    data: {
      projectId: data.projectId,
      authorName: data.authorName,
      authorRole: data.authorRole,
      content: data.content,
      isInternal: data.isInternal ?? false,
    },
  });
  revalidatePath(`/zakazky/${data.projectId}/komunikace`);
  return message;
}

// ============================================================================
// PROJECT DOCUMENTS
// ============================================================================

export async function getProjectDocuments(projectId: string, category?: string) {
  const where: Record<string, unknown> = { projectId };
  if (category) where.category = category;

  const documents = await prisma.projectDocument.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return documents;
}

export async function uploadProjectDocument(data: {
  projectId: string;
  category: string;
  title: string;
  fileName: string;
  fileUrl: string;
  visibleToClient?: boolean;
  visibleToSubcontractor?: boolean;
  uploadedBy?: string;
}) {
  const document = await prisma.projectDocument.create({
    data: {
      projectId: data.projectId,
      category: data.category as never,
      title: data.title,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      visibleToClient: data.visibleToClient ?? false,
      visibleToSubcontractor: data.visibleToSubcontractor ?? false,
      uploadedBy: data.uploadedBy,
    },
  });
  revalidatePath(`/zakazky/${data.projectId}/dokumenty`);
  return document;
}

export async function deleteProjectDocument(id: string) {
  const document = await prisma.projectDocument.delete({ where: { id } });
  revalidatePath(`/zakazky/${document.projectId}/dokumenty`);
  return document;
}

// ============================================================================
// CLIENT PORTAL
// ============================================================================

export async function generateClientPortalAccess(
  contactId: string,
  projectId: string,
  email: string
) {
  const accessToken = crypto.randomUUID();

  const access = await prisma.clientPortalAccess.upsert({
    where: {
      contactId_projectId: { contactId, projectId },
    },
    update: {
      accessToken,
      email,
      isActive: true,
    },
    create: {
      contactId,
      projectId,
      accessToken,
      email,
    },
  });

  return access;
}

export async function getClientPortalData(accessToken: string) {
  const access = await prisma.clientPortalAccess.findUnique({
    where: { accessToken },
  });

  if (!access || !access.isActive) return null;

  // Update last access
  await prisma.clientPortalAccess.update({
    where: { id: access.id },
    data: { lastAccess: new Date() },
  });

  const [project, documents, review] = await Promise.all([
    prisma.project.findUnique({
      where: { id: access.projectId },
      include: { contact: true },
    }),
    prisma.projectDocument.findMany({
      where: {
        projectId: access.projectId,
        visibleToClient: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.clientReview.findUnique({
      where: {
        projectId_contactId: {
          projectId: access.projectId,
          contactId: access.contactId,
        },
      },
    }),
  ]);

  return {
    project,
    documents,
    review,
    contactId: access.contactId,
    projectId: access.projectId,
  };
}

export async function submitClientReview(data: {
  projectId: string;
  contactId: string;
  overallRating: number;
  qualityRating?: number;
  communicationRating?: number;
  timelinessRating?: number;
  priceRating?: number;
  review?: string;
  wouldRecommend?: boolean;
}) {
  const review = await prisma.clientReview.create({
    data: {
      projectId: data.projectId,
      contactId: data.contactId,
      overallRating: data.overallRating,
      qualityRating: data.qualityRating,
      communicationRating: data.communicationRating,
      timelinessRating: data.timelinessRating,
      priceRating: data.priceRating,
      review: data.review,
      wouldRecommend: data.wouldRecommend,
    },
  });

  return review;
}
