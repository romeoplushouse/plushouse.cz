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
import { Plus, Users, Banknote, Calendar } from "lucide-react";

export default function PayrollPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zaměstnanci & Mzdy</h1>
          <p className="text-gray-500">
            Evidence zaměstnanců, výpočet mezd, výplatní pásky
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Mzdové období
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nový zaměstnanec
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Aktivní zaměstnanci</p>
                <p className="text-xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Banknote className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Mzdové náklady (měsíc)</p>
                <p className="text-xl font-bold">0 Kč</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">Aktuální období</p>
                <p className="text-xl font-bold">03/2026</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Zaměstnanci</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Č. zaměstnance</TableHead>
                <TableHead>Jméno</TableHead>
                <TableHead>Pozice</TableHead>
                <TableHead>Oddělení</TableHead>
                <TableHead>Nástup</TableHead>
                <TableHead className="text-right">Hrubá mzda</TableHead>
                <TableHead>Stav</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-medium">Zatím žádní zaměstnanci</p>
                  <p className="text-sm mt-1">Přidejte prvního zaměstnance</p>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
