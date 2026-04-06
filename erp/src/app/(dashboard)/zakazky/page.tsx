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
  QUOTED: "Naceněno",
  IN_PROGRESS: "V realizaci",
  ON_HOLD: "Pozastaveno",
  COMPLETED: "Dokončeno",
  CANCELLED: "Zrušeno",
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
          <h1 className="text-2xl font-bold text-white">Zakázky</h1>
          <p className="text-gray-500">
            Evidence zakázek, úkolů, materiálu a kontroly kvality
          </p>
        </div>
        <Link href="/zakazky/nova">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nová zakázka
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FolderKanban className="h-6 w-6 text-blue-400" />
              <div>
                <p className="text-sm text-gray-500">Nové</p>
                <p className="text-xl font-bold">{stats.new}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-amber-400" />
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
              <Pause className="h-6 w-6 text-amber-400" />
              <div>
                <p className="text-sm text-gray-500">Pozastavené</p>
                <p className="text-xl font-bold">{stats.onHold}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-emerald-400" />
              <div>
                <p className="text-sm text-gray-500">Dokončené</p>
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
            <p className="font-medium text-gray-400">Zatím žádné zakázky</p>
            <p className="text-sm text-gray-500 mt-1">
              Vytvořte první zakázku s úkoly, přiřazením pracovníků a sledováním průběhu
            </p>
            <Link href="/zakazky/nova">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Vytvořit zakázku
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
                  <TableHead>Číslo</TableHead>
                  <TableHead>Název</TableHead>
                  <TableHead>Zákazník</TableHead>
                  <TableHead>Stav</TableHead>
                  <TableHead>Rozpočet</TableHead>
                  <TableHead>Začátek</TableHead>
                  <TableHead>Úkoly</TableHead>
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
                    <TableCell className="text-gray-400">
                      {project.contact?.companyName ||
                        [project.contact?.firstName, project.contact?.lastName]
                          .filter(Boolean)
                          .join(" ") ||
                        "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[project.status] ?? "secondary"}>
                        {statusLabels[project.status] ?? project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {project.budget
                        ? formatCurrency(Number(project.budget))
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {project.startDate
                        ? formatDate(project.startDate)
                        : "—"}
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
