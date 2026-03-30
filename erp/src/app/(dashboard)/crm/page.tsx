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
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Users, Building, UserCheck } from "lucide-react";

export default function CRMPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM / Adresář</h1>
          <p className="text-gray-500">
            Zákazníci, dodavatelé, kontakty a komunikace
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nový kontakt
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b pb-2">
        <Button variant="default" size="sm">Všechny</Button>
        <Button variant="ghost" size="sm">Zákazníci</Button>
        <Button variant="ghost" size="sm">Dodavatelé</Button>
        <Button variant="ghost" size="sm">Subdodavatelé</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Zákazníci</p>
                <p className="text-xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Building className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Dodavatelé</p>
                <p className="text-xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">Subdodavatelé</p>
                <p className="text-xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Název / Jméno</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>IČO</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Město</TableHead>
                <TableHead>Hodnocení</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500 py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-medium">Zatím žádné kontakty</p>
                  <p className="text-sm mt-1">
                    Přidejte první kontakt kliknutím na &quot;Nový kontakt&quot;
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
