export const dynamic = "force-dynamic";
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
import { Plus } from "lucide-react";
import Link from "next/link";
import { getJournalEntries } from "@/lib/actions/accounting";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function JournalEntriesPage() {
  const { entries, total } = await getJournalEntries(1, 50);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ucetni denik</h1>
          <p className="text-gray-500">
            Chronologicky prehled vsech ucetnich zapisu ({total} celkem)
          </p>
        </div>
        <Link href="/ucetnictvi/denik/novy">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novy zapis
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cislo</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Popis</TableHead>
                <TableHead>Doklad</TableHead>
                <TableHead className="text-right">MD (Kc)</TableHead>
                <TableHead className="text-right">D (Kc)</TableHead>
                <TableHead>Stav</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-gray-500 py-8"
                  >
                    Zatim zadne ucetni zapisy. Kliknete na &quot;Novy
                    zapis&quot; pro vytvoreni prvniho zaznamu.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => {
                  const totalDebit = entry.items.reduce(
                    (sum, item) => sum + Number(item.debit),
                    0
                  );
                  const totalCredit = entry.items.reduce(
                    (sum, item) => sum + Number(item.credit),
                    0
                  );

                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono font-medium">
                        {entry.entryNumber}
                      </TableCell>
                      <TableCell>{formatDate(entry.date)}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {entry.description}
                      </TableCell>
                      <TableCell>
                        {entry.documentRef ? (
                          <span className="text-sm">
                            {entry.documentType && (
                              <Badge variant="outline" className="mr-1">
                                {entry.documentType}
                              </Badge>
                            )}
                            {entry.documentRef}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(totalDebit)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(totalCredit)}
                      </TableCell>
                      <TableCell>
                        {entry.isPosted ? (
                          <Badge variant="success">Zauctovano</Badge>
                        ) : (
                          <Badge variant="warning">Koncept</Badge>
                        )}
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
