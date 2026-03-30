export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Wallet,
  User,
  Hash,
} from "lucide-react";
import { getProjectById, getEmployees } from "@/lib/actions/projects";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { TaskList } from "@/components/projects/task-list";
import { MaterialList } from "@/components/projects/material-list";
import { QualityList } from "@/components/projects/quality-list";
import { MediaList } from "@/components/projects/media-list";
import { WorkerList } from "@/components/projects/worker-list";
import { StatusChanger } from "@/components/projects/status-changer";

const statusLabels: Record<string, string> = {
  NEW: "Nov\u00e1",
  QUOTED: "Nacen\u011bno",
  IN_PROGRESS: "V realizaci",
  ON_HOLD: "Pozastaveno",
  COMPLETED: "Dokon\u010deno",
  CANCELLED: "Zru\u0161eno",
};

const statusVariants: Record<
  string,
  "default" | "secondary" | "success" | "warning" | "destructive"
> = {
  NEW: "default",
  QUOTED: "secondary",
  IN_PROGRESS: "warning",
  ON_HOLD: "destructive",
  COMPLETED: "success",
  CANCELLED: "secondary",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, employees] = await Promise.all([
    getProjectById(id),
    getEmployees(),
  ]);

  if (!project) {
    notFound();
  }

  const contactName = project.contact
    ? project.contact.companyName ||
      [project.contact.firstName, project.contact.lastName]
        .filter(Boolean)
        .join(" ")
    : null;

  const materialTotal = project.materials.reduce(
    (sum, m) => sum + Number(m.totalCost),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/zakazky">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">
              {project.name}
            </h1>
            <Badge variant={statusVariants[project.status] ?? "secondary"}>
              {statusLabels[project.status] ?? project.status}
            </Badge>
          </div>
          <p className="text-gray-500 font-mono text-sm mt-1">
            {project.projectNumber}
          </p>
        </div>
        <StatusChanger projectId={project.id} currentStatus={project.status} />
      </div>

      {/* Tabs */}
      <ProjectTabs
        tabs={[
          {
            id: "prehled",
            label: "P\u0159ehled",
            content: (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Project info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informace o zak\u00e1zce</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {project.description && (
                      <div>
                        <p className="text-sm text-gray-500">Popis</p>
                        <p className="text-sm mt-1">{project.description}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">
                            Zah\u00e1jen\u00ed
                          </p>
                          <p className="text-sm">
                            {project.startDate
                              ? formatDate(project.startDate)
                              : "\u2014"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">
                            Ukon\u010den\u00ed
                          </p>
                          <p className="text-sm">
                            {project.endDate
                              ? formatDate(project.endDate)
                              : "\u2014"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Wallet className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">
                            Rozpo\u010det
                          </p>
                          <p className="text-sm font-medium">
                            {project.budget
                              ? formatCurrency(Number(project.budget))
                              : "\u2014"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Wallet className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">
                            N\u00e1klady na materi\u00e1l
                          </p>
                          <p className="text-sm font-medium">
                            {formatCurrency(materialTotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                    {project.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">
                            Adresa stavby
                          </p>
                          <p className="text-sm">{project.address}</p>
                          {project.lat && project.lng && (
                            <p className="text-xs text-gray-400">
                              {project.lat}, {project.lng}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <Hash className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">
                          \u010c\u00edslo zak\u00e1zky
                        </p>
                        <p className="text-sm font-mono">
                          {project.projectNumber}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Z\u00e1kazn\u00edk</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {project.contact ? (
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">
                              {contactName}
                            </p>
                            {project.contact.ico && (
                              <p className="text-xs text-gray-500">
                                I\u010cO: {project.contact.ico}
                              </p>
                            )}
                          </div>
                        </div>
                        {project.contact.email && (
                          <p className="text-sm text-gray-600">
                            {project.contact.email}
                          </p>
                        )}
                        {project.contact.phone && (
                          <p className="text-sm text-gray-600">
                            {project.contact.phone}
                          </p>
                        )}
                        {(project.contact.street || project.contact.city) && (
                          <p className="text-sm text-gray-600">
                            {[
                              project.contact.street,
                              project.contact.city,
                              project.contact.zip,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Bez p\u0159i\u0159azen\u00e9ho z\u00e1kazn\u00edka
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Quick summary cards */}
                <Card className="lg:col-span-2">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {project.tasks.length}
                        </p>
                        <p className="text-xs text-gray-500">\u00dakol\u016f</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {project.tasks.filter((t) => t.status === "DONE").length}
                        </p>
                        <p className="text-xs text-gray-500">Hotov\u00fdch</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {project.materials.length}
                        </p>
                        <p className="text-xs text-gray-500">Materi\u00e1l\u016f</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {project.projectWorkers.length}
                        </p>
                        <p className="text-xs text-gray-500">Pracovn\u00edk\u016f</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {project.mediaEvidence.length}
                        </p>
                        <p className="text-xs text-gray-500">Fotek/Vide\u00ed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ),
          },
          {
            id: "ukoly",
            label: `\u00dakoly (${project.tasks.length})`,
            content: (
              <TaskList
                projectId={project.id}
                tasks={project.tasks as any}
                employees={employees as any}
              />
            ),
          },
          {
            id: "material",
            label: `Materi\u00e1l (${project.materials.length})`,
            content: (
              <MaterialList
                projectId={project.id}
                materials={project.materials as any}
              />
            ),
          },
          {
            id: "kvalita",
            label: `Kvalita (${project.qualityChecks.length})`,
            content: (
              <QualityList
                projectId={project.id}
                checks={project.qualityChecks as any}
              />
            ),
          },
          {
            id: "foto",
            label: `Fotodokumentace (${project.mediaEvidence.length})`,
            content: (
              <MediaList
                projectId={project.id}
                media={project.mediaEvidence as any}
              />
            ),
          },
          {
            id: "pracovnici",
            label: `Pracovn\u00edci (${project.projectWorkers.length})`,
            content: (
              <WorkerList
                projectId={project.id}
                workers={project.projectWorkers as any}
                employees={employees as any}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
