import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderKanban, Clock, CheckCircle, Pause } from "lucide-react";

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zakázky</h1>
          <p className="text-gray-500">
            Evidence zakázek, úkolů, materiálu a kontroly kvality
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nová zakázka
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FolderKanban className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Nové</p>
                <p className="text-xl font-bold">0</p>
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
                <p className="text-xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Pause className="h-6 w-6 text-orange-600" />
              <div>
                <p className="text-sm text-gray-500">Pozastavené</p>
                <p className="text-xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Dokončené</p>
                <p className="text-xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty state */}
      <Card>
        <CardContent className="py-12 text-center">
          <FolderKanban className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-600">Zatím žádné zakázky</p>
          <p className="text-sm text-gray-500 mt-1">
            Vytvořte první zakázku s úkoly, přiřazením pracovníků a sledováním průběhu
          </p>
          <Button className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Vytvořit zakázku
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
