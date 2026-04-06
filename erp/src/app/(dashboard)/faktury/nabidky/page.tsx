import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, FileText } from "lucide-react";
import Link from "next/link";

export default function QuotesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Cenové nabídky</h1>
          <p className="text-gray-500">
            Přehled všech cenových nabídek a jejich stavu
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/faktury">
            <Button variant="outline">Zpět na faktury</Button>
          </Link>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Nová nabídka
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b pb-2">
        <Button variant="default" size="sm">
          Všechny
        </Button>
        <Button variant="ghost" size="sm">
          Otevřené
        </Button>
        <Button variant="ghost" size="sm">
          Přijaté
        </Button>
        <Button variant="ghost" size="sm">
          Odmítnuté
        </Button>
        <Button variant="ghost" size="sm">
          Expirované
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Otevřené nabídky</p>
            <p className="text-xl font-bold text-blue-400">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Přijaté tento měsíc</p>
            <p className="text-xl font-bold text-emerald-400">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Úspěšnost</p>
            <p className="text-xl font-bold text-gray-400">- %</p>
          </CardContent>
        </Card>
      </div>

      {/* Quotes Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Číslo</TableHead>
                <TableHead>Zákazník</TableHead>
                <TableHead>Popis</TableHead>
                <TableHead>Datum vytvoření</TableHead>
                <TableHead>Platnost do</TableHead>
                <TableHead className="text-right">Částka</TableHead>
                <TableHead>Stav</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-gray-500 py-12"
                >
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-medium">Zatím žádné cenové nabídky</p>
                  <p className="text-sm mt-1">
                    Modul cenových nabídek bude brzy dostupný
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
