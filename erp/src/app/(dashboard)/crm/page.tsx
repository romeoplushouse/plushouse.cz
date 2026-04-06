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
import { Plus, Download, Users, Building, UserCheck } from "lucide-react";
import { getContacts, getContactStats } from "@/lib/actions/contacts";
import Link from "next/link";

const TYPE_MAP: Record<string, { label: string; variant: "default" | "success" | "secondary" | "warning" | "destructive" }> = {
  CUSTOMER: { label: "Zákazník", variant: "default" },
  SUPPLIER: { label: "Dodavatel", variant: "success" },
  SUBCONTRACTOR: { label: "Subdodavatel", variant: "warning" },
  EMPLOYEE_CONTACT: { label: "Zaměstnanec", variant: "secondary" },
  OTHER: { label: "Ostatní", variant: "secondary" },
};

const FILTER_TABS = [
  { label: "Všechny", type: undefined },
  { label: "Zákazníci", type: "CUSTOMER" },
  { label: "Dodavatelé", type: "SUPPLIER" },
  { label: "Subdodavatelé", type: "SUBCONTRACTOR" },
] as const;

export default async function CRMPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const activeType = typeof resolvedParams.type === "string" ? resolvedParams.type : undefined;
  const page = typeof resolvedParams.page === "string" ? parseInt(resolvedParams.page, 10) : 1;

  const [{ contacts, total, pages }, stats] = await Promise.all([
    getContacts(activeType ? { type: activeType } : undefined, page),
    getContactStats(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">CRM / Adresář</h1>
          <p className="text-gray-500">
            Zákazníci, dodavatelé, kontakty a komunikace
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href="/crm/novy">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nový kontakt
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b pb-2">
        {FILTER_TABS.map((tab) => {
          const isActive = activeType === tab.type || (!activeType && !tab.type);
          const href = tab.type ? `/crm?type=${tab.type}` : "/crm";
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-sm text-gray-500">Zákazníci</p>
                <p className="text-xl font-bold">{stats.customers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Building className="h-8 w-8 text-emerald-400" />
              <div>
                <p className="text-sm text-gray-500">Dodavatelé</p>
                <p className="text-xl font-bold">{stats.suppliers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-sm text-gray-500">Subdodavatelé</p>
                <p className="text-xl font-bold">{stats.subcontractors}</p>
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
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-12">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium">Zatím žádné kontakty</p>
                    <p className="text-sm mt-1">
                      Přidejte první kontakt kliknutím na &quot;Nový kontakt&quot;
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                contacts.map((contact) => {
                  const displayName =
                    contact.companyName ||
                    [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
                    "Bez názvu";
                  const typeInfo = TYPE_MAP[contact.type] || TYPE_MAP.OTHER;

                  return (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <Link
                          href={`/crm/${contact.id}`}
                          className="font-medium text-[#B5E126] hover:underline"
                        >
                          {displayName}
                        </Link>
                        {contact.companyName && (contact.firstName || contact.lastName) && (
                          <p className="text-sm text-gray-500">
                            {[contact.firstName, contact.lastName].filter(Boolean).join(" ")}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {contact.ico || "-"}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {contact.email || "-"}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {contact.phone || "-"}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {contact.city || "-"}
                      </TableCell>
                      <TableCell>
                        <Link href={`/crm/${contact.id}`}>
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
            if (p > 1) params.set("page", String(p));
            const href = `/crm${params.toString() ? `?${params.toString()}` : ""}`;
            return (
              <Link key={p} href={href}>
                <Button variant={p === page ? "default" : "outline"} size="sm">
                  {p}
                </Button>
              </Link>
            );
          })}
        </div>
      )}

      <p className="text-sm text-gray-500 text-center">
        Celkem {total} kontaktů
      </p>
    </div>
  );
}
