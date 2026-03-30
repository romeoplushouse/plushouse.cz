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
import { CreditCard, ArrowDownLeft, ArrowUpRight, QrCode, Plus } from "lucide-react";

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platby</h1>
          <p className="text-gray-500">
            Evidence plateb, bankovní notifikace, QR platby
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <QrCode className="h-4 w-4 mr-2" />
            QR platba
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nová platba
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ArrowDownLeft className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Přijaté platby (měsíc)</p>
                <p className="text-xl font-bold text-green-600">0 Kč</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ArrowUpRight className="h-6 w-6 text-red-600" />
              <div>
                <p className="text-sm text-gray-500">Odeslané platby (měsíc)</p>
                <p className="text-xl font-bold text-red-600">0 Kč</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Nespárované notifikace</p>
                <p className="text-xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historie plateb</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Kontakt</TableHead>
                <TableHead>VS</TableHead>
                <TableHead>Způsob</TableHead>
                <TableHead className="text-right">Částka</TableHead>
                <TableHead>Faktura</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                  Zatím žádné platby
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
