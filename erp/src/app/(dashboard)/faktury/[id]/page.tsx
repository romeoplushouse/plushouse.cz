export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, Printer, FileDown, QrCode } from "lucide-react";
import { getInvoiceById } from "@/lib/actions/invoices";
import { formatCurrency, formatDate } from "@/lib/utils";
import InvoiceStatusActions from "./status-actions";

const STATUS_MAP: Record<
  string,
  { label: string; variant: "secondary" | "default" | "success" | "destructive" }
> = {
  DRAFT: { label: "Koncept", variant: "secondary" },
  SENT: { label: "Odeslana", variant: "default" },
  PARTIALLY_PAID: { label: "Castecne uhrazena", variant: "default" },
  PAID: { label: "Uhrazena", variant: "success" },
  OVERDUE: { label: "Po splatnosti", variant: "destructive" },
  CANCELLED: { label: "Zrusena", variant: "secondary" },
};

const TYPE_MAP: Record<string, string> = {
  ISSUED: "Vydana faktura",
  RECEIVED: "Prijata faktura",
  ADVANCE: "Zalohova faktura",
  PROFORMA: "Proforma faktura",
  CREDIT_NOTE: "Dobropis",
  TAX_DOCUMENT: "Danovy doklad",
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);

  if (!invoice) {
    notFound();
  }

  const contact = invoice.customer || invoice.supplier;
  const contactName = contact
    ? contact.companyName ||
      [contact.firstName, contact.lastName].filter(Boolean).join(" ")
    : null;

  const statusInfo = STATUS_MAP[invoice.status] || {
    label: invoice.status,
    variant: "secondary" as const,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/faktury">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {invoice.invoiceNumber}
              </h1>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            <p className="text-gray-500">
              {TYPE_MAP[invoice.type] || invoice.type}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Tisk
          </Button>
          <Button variant="outline">
            <FileDown className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact & dates */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    {invoice.type === "RECEIVED" ? "Dodavatel" : "Odberatel"}
                  </h3>
                  {contactName ? (
                    <div>
                      <p className="font-medium text-gray-900">{contactName}</p>
                      {contact?.ico && (
                        <p className="text-sm text-gray-500">
                          ICO: {contact.ico}
                        </p>
                      )}
                      {contact?.dic && (
                        <p className="text-sm text-gray-500">
                          DIC: {contact.dic}
                        </p>
                      )}
                      {contact?.street && (
                        <p className="text-sm text-gray-500">
                          {contact.street}
                          {contact.city && `, ${contact.city}`}
                          {contact.zip && ` ${contact.zip}`}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Neuveden</p>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Datum vystaveni:</span>
                    <span className="font-medium">
                      {formatDate(invoice.issueDate)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Datum splatnosti:</span>
                    <span className="font-medium">
                      {formatDate(invoice.dueDate)}
                    </span>
                  </div>
                  {invoice.taxDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">DUZP:</span>
                      <span className="font-medium">
                        {formatDate(invoice.taxDate)}
                      </span>
                    </div>
                  )}
                  {invoice.variableSymbol && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Variabilni symbol:</span>
                      <span className="font-medium">
                        {invoice.variableSymbol}
                      </span>
                    </div>
                  )}
                  {invoice.bankAccount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Bankovni ucet:</span>
                      <span className="font-medium">
                        {invoice.bankAccount}
                      </span>
                    </div>
                  )}
                  {invoice.paymentMethod && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Zpusob uhrady:</span>
                      <span className="font-medium">
                        {invoice.paymentMethod === "BANK_TRANSFER"
                          ? "Bankovni prevod"
                          : invoice.paymentMethod === "CASH"
                          ? "Hotovost"
                          : invoice.paymentMethod === "CARD"
                          ? "Kartou"
                          : invoice.paymentMethod}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line items table */}
          <Card>
            <CardHeader>
              <CardTitle>Polozky</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Popis</TableHead>
                    <TableHead className="text-right">Mnozstvi</TableHead>
                    <TableHead>Jednotka</TableHead>
                    <TableHead className="text-right">Cena za j.</TableHead>
                    <TableHead className="text-right">DPH</TableHead>
                    <TableHead className="text-right">DPH castka</TableHead>
                    <TableHead className="text-right">Celkem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">
                        {Number(item.quantity)}
                      </TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(item.unitPrice))}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(item.vatRate)} %
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(item.vatAmount))}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(item.total))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Totals */}
              <div className="border-t p-4">
                <div className="flex flex-col items-end space-y-1">
                  <div className="flex justify-between w-72 text-sm">
                    <span className="text-gray-500">Zaklad bez DPH:</span>
                    <span className="font-medium">
                      {formatCurrency(Number(invoice.subtotal))}
                    </span>
                  </div>
                  <div className="flex justify-between w-72 text-sm">
                    <span className="text-gray-500">DPH celkem:</span>
                    <span className="font-medium">
                      {formatCurrency(Number(invoice.vatAmount))}
                    </span>
                  </div>
                  <div className="flex justify-between w-72 text-lg border-t pt-2 mt-1">
                    <span className="font-semibold">Celkem k uhrade:</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(Number(invoice.total))}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Poznamky</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {invoice.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Payment history */}
          <Card>
            <CardHeader>
              <CardTitle>Historie plateb</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.payments && invoice.payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead className="text-right">Castka</TableHead>
                      <TableHead>Zpusob</TableHead>
                      <TableHead>Poznamka</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDate(payment.date)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(payment.amount))}
                        </TableCell>
                        <TableCell>{payment.method || "-"}</TableCell>
                        <TableCell className="text-gray-500">
                          {payment.note || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-gray-400">
                  Zatim zadne zaznamenane platby
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status actions */}
          <InvoiceStatusActions
            invoiceId={invoice.id}
            currentStatus={invoice.status}
          />

          {/* QR code */}
          {invoice.qrPaymentCode && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  QR platba
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 border rounded-md p-4 text-xs font-mono break-all">
                  {invoice.qrPaymentCode}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Tento kod lze pouzit pro QR platbu v mobilni aplikaci banky
                </p>
              </CardContent>
            </Card>
          )}

          {/* Project link */}
          {invoice.project && (
            <Card>
              <CardHeader>
                <CardTitle>Zakazka</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/zakazky/${invoice.project.id}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  {invoice.project.name}
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
