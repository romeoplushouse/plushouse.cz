export const dynamic = "force-dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ArrowDownLeft, ArrowUpRight, QrCode, Plus } from "lucide-react";
import Link from "next/link";
import { getPaymentHistory } from "@/lib/actions/payments";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function PaymentsPage() {
  const { payments, total } = await getPaymentHistory();

  const incomingTotal = payments
    .filter((p) => p.type === "INCOMING")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const outgoingTotal = payments
    .filter((p) => p.type === "OUTGOING")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Platby</h1>
          <p className="text-gray-500">Evidence plateb, bankovní notifikace, QR platby</p>
        </div>
        <div className="flex gap-2">
          <Link href="/platby/nova">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nová platba
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ArrowDownLeft className="h-6 w-6 text-emerald-400" />
              <div>
                <p className="text-sm text-gray-500">Přijaté platby</p>
                <p className="text-xl font-bold text-emerald-400">{formatCurrency(incomingTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ArrowUpRight className="h-6 w-6 text-red-400" />
              <div>
                <p className="text-sm text-gray-500">Odeslané platby</p>
                <p className="text-xl font-bold text-red-400">{formatCurrency(outgoingTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-blue-400" />
              <div>
                <p className="text-sm text-gray-500">Celkem plateb</p>
                <p className="text-xl font-bold">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Historie plateb</CardTitle></CardHeader>
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
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium">Zatím žádné platby</p>
                    <p className="text-sm mt-1">
                      <Link href="/platby/nova" className="text-[#B5E126] hover:underline">
                        Zaznamenejte první platbu
                      </Link>
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.date)}</TableCell>
                    <TableCell>
                      <Badge variant={payment.type === "INCOMING" ? "success" : "destructive"}>
                        {payment.type === "INCOMING" ? "Příjem" : "Výdaj"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payment.contact
                        ? payment.contact.companyName ||
                          `${payment.contact.firstName ?? ""} ${payment.contact.lastName ?? ""}`
                        : "—"}
                    </TableCell>
                    <TableCell className="font-mono">{payment.variableSymbol ?? "—"}</TableCell>
                    <TableCell>{payment.method}</TableCell>
                    <TableCell className={`text-right font-bold ${payment.type === "INCOMING" ? "text-emerald-400" : "text-red-400"}`}>
                      {payment.type === "INCOMING" ? "+" : "-"}
                      {formatCurrency(Number(payment.amount))}
                    </TableCell>
                    <TableCell>
                      {payment.invoice ? (
                        <Link href={`/faktury/${payment.invoice.id}`} className="text-[#B5E126] hover:underline">
                          {payment.invoice.invoiceNumber}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
