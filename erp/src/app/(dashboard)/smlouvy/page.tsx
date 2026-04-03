export const dynamic = "force-dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, FileSignature, Clock, CheckCircle, AlertTriangle, Eye } from "lucide-react";
import Link from "next/link";
import { getContracts, getContractStats } from "@/lib/actions/contracts";
import { formatDate } from "@/lib/utils";

const statusMap: Record<string, { label: string; variant: "secondary" | "default" | "success" | "warning" | "destructive" }> = {
  DRAFT: { label: "Koncept", variant: "secondary" },
  PENDING_FIELDS: { label: "Čeká na vyplnění", variant: "warning" },
  PENDING_SIGNATURE: { label: "Čeká na podpis", variant: "default" },
  PARTIALLY_SIGNED: { label: "Částečně podepsáno", variant: "warning" },
  SIGNED: { label: "Podepsáno", variant: "success" },
  REJECTED: { label: "Odmítnuto", variant: "destructive" },
  EXPIRED: { label: "Vypršelo", variant: "secondary" },
  CANCELLED: { label: "Zrušeno", variant: "secondary" },
  ARCHIVED: { label: "Archivováno", variant: "secondary" },
};

const typeMap: Record<string, string> = {
  EMPLOYMENT_HPP: "Pracovní smlouva",
  EMPLOYMENT_DPP: "DPP",
  EMPLOYMENT_DPC: "DPČ",
  EMPLOYMENT_SOD: "Smlouva o dílo",
  EMPLOYMENT_RS: "Rámcová smlouva",
  SUBCONTRACTOR: "Subdodavatel",
  NDA: "NDA",
  SERVICE: "Služby",
  LEASE: "Nájem",
  OTHER: "Jiná",
};

export default async function ContractsPage() {
  const [{ contracts, total }, stats] = await Promise.all([
    getContracts(),
    getContractStats(),
  ]);

  return (
    <div className="page-enter space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Smlouvy</h1>
          <p className="text-gray-500">Elektronické podepisování smluv s BankID ověřením</p>
        </div>
        <Link href="/smlouvy/nova">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nová smlouva
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="card-hover overflow-hidden rounded-2xl border-0 shadow-sm">
          <div className="flex">
            <div className="w-1 shrink-0 bg-gradient-to-b from-blue-500 to-blue-600" />
            <CardContent className="p-5 flex-1">
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-500">Celkem smluv</p>
            </CardContent>
          </div>
        </Card>
        <Card className="card-hover overflow-hidden rounded-2xl border-0 shadow-sm">
          <div className="flex">
            <div className="w-1 shrink-0 bg-gradient-to-b from-amber-500 to-orange-600" />
            <CardContent className="p-5 flex-1">
              <p className="text-3xl font-bold">{stats.pending}</p>
              <p className="text-sm text-gray-500">Čekají na podpis</p>
            </CardContent>
          </div>
        </Card>
        <Card className="card-hover overflow-hidden rounded-2xl border-0 shadow-sm">
          <div className="flex">
            <div className="w-1 shrink-0 bg-gradient-to-b from-green-500 to-emerald-600" />
            <CardContent className="p-5 flex-1">
              <p className="text-3xl font-bold">{stats.signed}</p>
              <p className="text-sm text-gray-500">Podepsáno</p>
            </CardContent>
          </div>
        </Card>
        <Card className="card-hover overflow-hidden rounded-2xl border-0 shadow-sm">
          <div className="flex">
            <div className="w-1 shrink-0 bg-gradient-to-b from-red-500 to-rose-600" />
            <CardContent className="p-5 flex-1">
              <p className="text-3xl font-bold">{stats.expired}</p>
              <p className="text-sm text-gray-500">Vypršelo</p>
            </CardContent>
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Číslo</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Název</TableHead>
                <TableHead>Druhá strana</TableHead>
                <TableHead>Platnost</TableHead>
                <TableHead>Stav</TableHead>
                <TableHead>Podpisy</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500 py-12">
                    <FileSignature className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium">Zatím žádné smlouvy</p>
                    <p className="text-sm mt-1">
                      <Link href="/smlouvy/nova" className="text-blue-600 hover:underline">
                        Vytvořte první smlouvu
                      </Link>
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                contracts.map((c) => {
                  const si = statusMap[c.status] ?? statusMap.DRAFT;
                  const signedCount = c.signingRequests.filter((r) => r.status === "SIGNED").length;
                  const totalSigners = c.signingRequests.length;
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-sm">{c.contractNumber}</TableCell>
                      <TableCell>{typeMap[c.type] ?? c.type}</TableCell>
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell>{c.partyBName}</TableCell>
                      <TableCell className="text-sm">
                        {c.validFrom ? formatDate(c.validFrom) : "—"}
                        {c.validTo ? ` – ${formatDate(c.validTo)}` : ""}
                      </TableCell>
                      <TableCell><Badge variant={si.variant}>{si.label}</Badge></TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {signedCount}/{totalSigners}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link href={`/smlouvy/${c.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />Detail
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
    </div>
  );
}
