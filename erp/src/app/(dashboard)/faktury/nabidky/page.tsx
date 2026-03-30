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
          <h1 className="text-2xl font-bold text-gray-900">Cenove nabidky</h1>
          <p className="text-gray-500">
            Prehled vsech cenovych nabidek a jejich stavu
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/faktury">
            <Button variant="outline">Zpet na faktury</Button>
          </Link>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Nova nabidka
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b pb-2">
        <Button variant="default" size="sm">
          Vsechny
        </Button>
        <Button variant="ghost" size="sm">
          Otevrene
        </Button>
        <Button variant="ghost" size="sm">
          Prijate
        </Button>
        <Button variant="ghost" size="sm">
          Odmitnute
        </Button>
        <Button variant="ghost" size="sm">
          Expirované
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Otevrene nabidky</p>
            <p className="text-xl font-bold text-blue-600">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Prijate tento mesic</p>
            <p className="text-xl font-bold text-green-600">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Uspesnost</p>
            <p className="text-xl font-bold text-gray-600">- %</p>
          </CardContent>
        </Card>
      </div>

      {/* Quotes Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cislo</TableHead>
                <TableHead>Zakaznik</TableHead>
                <TableHead>Popis</TableHead>
                <TableHead>Datum vytvoreni</TableHead>
                <TableHead>Platnost do</TableHead>
                <TableHead className="text-right">Castka</TableHead>
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
                  <p className="font-medium">Zatim zadne cenove nabidky</p>
                  <p className="text-sm mt-1">
                    Modul cenovych nabidek bude brzy dostupny
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
