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
import { Plus, Download, FileText, Receipt, FileCheck } from "lucide-react";
import Link from "next/link";

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faktury</h1>
          <p className="text-gray-500">
            Vydané a přijaté faktury, zálohové faktury, daňové doklady
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nová faktura
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b pb-2">
        <Button variant="default" size="sm">Všechny</Button>
        <Button variant="ghost" size="sm">Vydané</Button>
        <Button variant="ghost" size="sm">Přijaté</Button>
        <Button variant="ghost" size="sm">Zálohové</Button>
        <Button variant="ghost" size="sm">Daňové doklady</Button>
        <Button variant="ghost" size="sm">Dobropisy</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Neuhrazené vydané</p>
            <p className="text-xl font-bold text-blue-600">0 Kč</p>
            <p className="text-xs text-gray-400">0 faktur</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Po splatnosti</p>
            <p className="text-xl font-bold text-red-600">0 Kč</p>
            <p className="text-xs text-gray-400">0 faktur</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Uhrazené tento měsíc</p>
            <p className="text-xl font-bold text-green-600">0 Kč</p>
            <p className="text-xs text-gray-400">0 faktur</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Neuhrazené přijaté</p>
            <p className="text-xl font-bold text-orange-600">0 Kč</p>
            <p className="text-xs text-gray-400">0 faktur</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Číslo</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Odběratel / Dodavatel</TableHead>
                <TableHead>Datum vystavení</TableHead>
                <TableHead>Splatnost</TableHead>
                <TableHead className="text-right">Částka</TableHead>
                <TableHead>Stav</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500 py-12">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-medium">Zatím žádné faktury</p>
                  <p className="text-sm mt-1">
                    Vytvořte první fakturu kliknutím na tlačítko &quot;Nová faktura&quot;
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
