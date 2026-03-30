export const dynamic = "force-dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  FolderKanban,
  Clock,
  CheckCircle,
  Pause,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { getProjects, getProjectStats } from "@/lib/actions/projects";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  NEW: "Nová",
  QUOTED: "Nacen\u011Bno",
  IN_PROGRESS: "V realizaci",
  ON_HOLD: "Pozastaveno",
  COMPLETED: "Dokon\u010Deno",
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

export default async function ProjectsPage() {
  const [{ projects, total }, stats] = await Promise.all([
    getProjects(),
    getProjectStats(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zak\u00e1zky</h1>
          <p className="text-gray-500">
            Evidence zak\u00e1zek, \u00fakol\u016f, materi\u00e1lu a kontroly kvality
          </p>
        </div>
        <Link href="/zakazky/nova">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nov\u00e1 zak\u00e1zka
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FolderKanban className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Nov\u00e9</p>
                <p className="text-xl font-bold">{stats.new}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-500">V realizaci</p>
                <p className="text-xl font-bold">{stats.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Pause className="h-6 w-6 text-orange-600" />
              <div>
                <p className="text-sm text-gray-500">Pozastaven\u00e9</p>
                <p className="text-xl font-bold">{stats.onHold}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Dokon\u010Den\u00e9</p>
                <p className="text-xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Table or Empty State */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderKanban className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-600">Zat\u00edm \u017e\u00e1dn\u00e9 zak\u00e1zky</p>
            <p className="text-sm text-gray-500 mt-1">
              Vytvo\u0159te prvn\u00ed zak\u00e1zku s \u00fakoly, p\u0159i\u0159azen\u00edm pracovn\u00edk\u016f a sledov\u00e1n\u00edm pr\u016fb\u011bhu
            </p>
            <Link href="/zakazky/nova">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Vytvo\u0159it zak\u00e1zku
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>\u010C\u00edslo</TableHead>
                  <TableHead>N\u00e1zev</TableHead>
                  <TableHead>Z\u00e1kazn\u00edk</TableHead>
                  <TableHead>Stav</TableHead>
                  <TableHead>Rozpo\u010Det</TableHead>
                  <TableHead>Za\u010D\u00e1tek</TableHead>
                  <TableHead>\u00dakoly</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-mono text-sm">
                      {project.projectNumber}
                    </TableCell>
                    <TableCell className="font-medium">
                      {project.name}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {project.contact?.companyName ||
                        [project.contact?.firstName, project.contact?.lastName]
                          .filter(Boolean)
                          .join(" ") ||
                        "\u2014"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[project.status] ?? "secondary"}>
                        {statusLabels[project.status] ?? project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {project.budget
                        ? formatCurrency(Number(project.budget))
                        : "\u2014"}
                    </TableCell>
                    <TableCell>
                      {project.startDate
                        ? formatDate(project.startDate)
                        : "\u2014"}
                    </TableCell>
                    <TableCell>
                      {project.tasks.length}
                    </TableCell>
                    <TableCell>
                      <Link href={`/zakazky/${project.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Detail
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
