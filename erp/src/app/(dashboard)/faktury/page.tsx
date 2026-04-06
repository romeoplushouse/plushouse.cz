export const dynamic = "force-dynamic";
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
import { Plus, Download, FileText } from "lucide-react";
import Link from "next/link";
import { getInvoices, getInvoiceStats } from "@/lib/actions/invoices";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_MAP: Record<
  string,
  { label: string; variant: "secondary" | "default" | "success" | "destructive" }
> = {
  DRAFT: { label: "Koncept", variant: "secondary" },
  SENT: { label: "Odeslaná", variant: "default" },
  PARTIALLY_PAID: { label: "Částečně uhrazená", variant: "default" },
  PAID: { label: "Uhrazená", variant: "success" },
  OVERDUE: { label: "Po splatnosti", variant: "destructive" },
  CANCELLED: { label: "Zrušená", variant: "secondary" },
};

const TYPE_MAP: Record<string, string> = {
  ISSUED: "Vydaná",
  RECEIVED: "Přijatá",
  ADVANCE: "Zálohová",
  PROFORMA: "Proforma",
  CREDIT_NOTE: "Dobropis",
  TAX_DOCUMENT: "Daňový doklad",
};

const FILTER_TABS = [
  { label: "Všechny", type: undefined },
  { label: "Vydané", type: "ISSUED" },
  { label: "Přijaté", type: "RECEIVED" },
  { label: "Zálohové", type: "ADVANCE" },
  { label: "Daňové doklady", type: "TAX_DOCUMENT" },
  { label: "Dobropisy", type: "CREDIT_NOTE" },
];

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const activeType = typeof resolvedParams.type === "string" ? resolvedParams.type : undefined;
  const activeStatus = typeof resolvedParams.status === "string" ? resolvedParams.status : undefined;
  const page = typeof resolvedParams.page === "string" ? parseInt(resolvedParams.page, 10) : 1;

  const [{ invoices, total, pages }, stats] = await Promise.all([
    getInvoices({ type: activeType, status: activeStatus }, page),
    getInvoiceStats(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Faktury</h1>
          <p className="text-gray-500">
            Vydané a přijaté faktury, zálohové faktury, daňové doklady
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href="/faktury/nova">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nová faktura
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b pb-2">
        {FILTER_TABS.map((tab) => {
          const isActive = activeType === tab.type || (!activeType && !tab.type);
          const href = tab.type ? `/faktury?type=${tab.type}` : "/faktury";
          return (
            <Link key={tab.label} href={href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                size="sm"
              >
                {tab.label}
              </Button>
            </Link>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Neuhrazené vydané</p>
            <p className="text-xl font-bold text-blue-400">
              {formatCurrency(stats.unpaidIssued.amount)}
            </p>
            <p className="text-xs text-gray-400">
              {stats.unpaidIssued.count} faktur
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Po splatnosti</p>
            <p className="text-xl font-bold text-red-400">
              {formatCurrency(stats.overdue.amount)}
            </p>
            <p className="text-xs text-gray-400">
              {stats.overdue.count} faktur
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Uhrazené tento měsíc</p>
            <p className="text-xl font-bold text-emerald-400">
              {formatCurrency(stats.paidThisMonth.amount)}
            </p>
            <p className="text-xs text-gray-400">
              {stats.paidThisMonth.count} faktur
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Neuhrazené přijaté</p>
            <p className="text-xl font-bold text-amber-400">
              {formatCurrency(stats.unpaidReceived.amount)}
            </p>
            <p className="text-xs text-gray-400">
              {stats.unpaidReceived.count} faktur
            </p>
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
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-gray-500 py-12"
                  >
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium">Zatím žádné faktury</p>
                    <p className="text-sm mt-1">
                      Vytvořte první fakturu kliknutím na tlačítko &quot;Nová
                      faktura&quot;
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => {
                  const contact = invoice.customer || invoice.supplier;
                  const contactName = contact
                    ? contact.companyName ||
                      [contact.firstName, contact.lastName]
                        .filter(Boolean)
                        .join(" ")
                    : "-";
                  const statusInfo = STATUS_MAP[invoice.status] || {
                    label: invoice.status,
                    variant: "secondary" as const,
                  };

                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/faktury/${invoice.id}`}
                          className="text-[#B5E126] hover:underline"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {TYPE_MAP[invoice.type] || invoice.type}
                      </TableCell>
                      <TableCell>{contactName}</TableCell>
                      <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(invoice.total))}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/faktury/${invoice.id}`}>
                          <Button variant="ghost" size="sm">
                            Detail
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams();
            if (activeType) params.set("type", activeType);
            if (activeStatus) params.set("status", activeStatus);
            params.set("page", String(p));
            return (
              <Link key={p} href={`/faktury?${params.toString()}`}>
                <Button
                  variant={p === page ? "default" : "outline"}
                  size="sm"
                >
                  {p}
                </Button>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
