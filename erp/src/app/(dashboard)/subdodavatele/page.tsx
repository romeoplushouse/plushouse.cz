export const dynamic = "force-dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Hammer, FileSignature, Star, Eye } from "lucide-react";
import Link from "next/link";
import { getSubcontractors } from "@/lib/actions/subcontractors";
import { formatCurrency } from "@/lib/utils";

export default async function SubcontractorsPage() {
  const { subcontractors, total } = await getSubcontractors();

  const withAgreement = subcontractors.filter((s) => s.hasFrameworkAgreement).length;
  const avgRating =
    subcontractors.filter((s) => s.rating).length > 0
      ? subcontractors.reduce((sum, s) => sum + (s.rating ?? 0), 0) /
        subcontractors.filter((s) => s.rating).length
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Subdodavatelé</h1>
          <p className="text-gray-500">
            Rámcové smlouvy, ceníky, specializace, hodnocení
          </p>
        </div>
        <Link href="/subdodavatele/novy">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nový subdodavatel
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Hammer className="h-6 w-6 text-blue-400" />
              <div>
                <p className="text-sm text-gray-500">Aktivní subdodavatelé</p>
                <p className="text-xl font-bold">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileSignature className="h-6 w-6 text-emerald-400" />
              <div>
                <p className="text-sm text-gray-500">Platné rámcové smlouvy</p>
                <p className="text-xl font-bold">{withAgreement}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Star className="h-6 w-6 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-500">Průměrné hodnocení</p>
                <p className="text-xl font-bold">
                  {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Firma</TableHead>
                <TableHead>Specializace</TableHead>
                <TableHead>Obor</TableHead>
                <TableHead>Hodinová sazba</TableHead>
                <TableHead>Rámcová smlouva</TableHead>
                <TableHead>Hodnocení</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subcontractors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-12">
                    <Hammer className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium">Zatím žádní subdodavatelé</p>
                    <p className="text-sm mt-1">
                      <Link href="/subdodavatele/novy" className="text-[#B5E126] hover:underline">
                        Přidejte prvního subdodavatele
                      </Link>
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                subcontractors.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">
                      {sub.contact.companyName ?? "—"}
                    </TableCell>
                    <TableCell>{sub.specialization ?? "—"}</TableCell>
                    <TableCell>{sub.trade ?? "—"}</TableCell>
                    <TableCell>
                      {sub.hourlyRate ? formatCurrency(Number(sub.hourlyRate)) + "/hod" : "—"}
                    </TableCell>
                    <TableCell>
                      {sub.hasFrameworkAgreement ? (
                        <Badge variant="success">Platná</Badge>
                      ) : (
                        <Badge variant="secondary">Bez smlouvy</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {sub.rating ? (
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          {sub.rating.toFixed(1)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/subdodavatele/${sub.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Detail
                        </Button>
                      </Link>
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
