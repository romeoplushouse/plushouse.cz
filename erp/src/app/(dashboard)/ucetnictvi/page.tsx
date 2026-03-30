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
import { Plus, Download, BookOpen, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import {
  getJournalEntries,
  getAccountingStats,
} from "@/lib/actions/accounting";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AccountingPage() {
  const [stats, recent] = await Promise.all([
    getAccountingStats(),
    getJournalEntries(1, 5),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ucetnictvi</h1>
          <p className="text-gray-500">
            Podvojne ucetnictvi - ucetni denik, hlavni kniha, predvaha
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href="/ucetnictvi/denik/novy">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novy zapis
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Ucetni denik</p>
                <p className="text-xl font-bold">
                  {stats.journalCount} zapisu
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Uctovy rozvrh</p>
                <p className="text-xl font-bold">{stats.accountCount} uctu</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">Obdobi</p>
                <p className="text-xl font-bold">{stats.currentYear}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/ucetnictvi/denik">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-medium">Ucetni denik</h3>
              <p className="text-xs text-gray-500 mt-1">
                Chronologicke zapisy
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/ucetnictvi/hlavni-kniha">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <FileSpreadsheet className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium">Hlavni kniha</h3>
              <p className="text-xs text-gray-500 mt-1">Ucty a obraty</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/ucetnictvi/predvaha">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <FileSpreadsheet className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-medium">Predvaha</h3>
              <p className="text-xs text-gray-500 mt-1">Trial balance</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/ucetnictvi/uctovy-rozvrh">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <FileSpreadsheet className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-medium">Uctovy rozvrh</h3>
              <p className="text-xs text-gray-500 mt-1">Chart of accounts</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Journal Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Posledni zapisy v deniku</CardTitle>
        </CardHeader>
        <CardContent>
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
              {recent.entries.length === 0 ? (
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
                recent.entries.map((entry) => {
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
                        {entry.documentRef || (
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
