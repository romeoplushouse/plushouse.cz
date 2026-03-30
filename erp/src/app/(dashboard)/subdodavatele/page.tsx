import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Hammer, FileSignature, Star } from "lucide-react";

export default function SubcontractorsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subdodavatelé</h1>
          <p className="text-gray-500">
            Rámcové smlouvy, ceníky, specializace, hodnocení
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nový subdodavatel
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Hammer className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Aktivní subdodavatelé</p>
                <p className="text-xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileSignature className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Platné rámcové smlouvy</p>
                <p className="text-xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Star className="h-6 w-6 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-500">Průměrné hodnocení</p>
                <p className="text-xl font-bold">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Firma</TableHead>
                <TableHead>Specializace</TableHead>
                <TableHead>Obor</TableHead>
                <TableHead>Hodinová sazba</TableHead>
                <TableHead>Rámcová smlouva</TableHead>
                <TableHead>Hodnocení</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-12">
                  <Hammer className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-medium">Zatím žádní subdodavatelé</p>
                  <p className="text-sm mt-1">
                    Přidejte subdodavatele s jejich specializací a ceníkem
                  </p>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
