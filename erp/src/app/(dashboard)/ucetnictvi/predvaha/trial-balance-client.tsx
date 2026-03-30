"use client";

import { useState, useTransition, useEffect, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Download } from "lucide-react";
import { getTrialBalance } from "@/lib/actions/accounting";
import { formatCurrency } from "@/lib/utils";

type TrialBalanceRow = {
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
};

const classLabels: Record<string, string> = {
  "0": "Trida 0 - Dlouhodoby majetek",
  "1": "Trida 1 - Zasoby",
  "2": "Trida 2 - Kratky financni majetek",
  "3": "Trida 3 - Zuctovaci vztahy",
  "4": "Trida 4 - Kapitalove ucty",
  "5": "Trida 5 - Naklady",
  "6": "Trida 6 - Vynosy",
  "7": "Trida 7 - Zaverkove ucty",
};

export function TrialBalanceClient() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [data, setData] = useState<TrialBalanceRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Load on mount
  useEffect(() => {
    handleSearch();
  }, []);

  function handleSearch() {
    startTransition(async () => {
      const result = await getTrialBalance(
        dateFrom || undefined,
        dateTo || undefined
      );
      setData(result);
      setLoaded(true);
    });
  }

  // Group by account class (first digit of code)
  const grouped = new Map<string, TrialBalanceRow[]>();
  for (const row of data) {
    const cls = row.code.charAt(0);
    if (!grouped.has(cls)) {
      grouped.set(cls, []);
    }
    grouped.get(cls)!.push(row);
  }

  const grandTotalDebit = data.reduce((sum, r) => sum + r.debit, 0);
  const grandTotalCredit = data.reduce((sum, r) => sum + r.credit, 0);
  const isBalanced = Math.abs(grandTotalDebit - grandTotalCredit) < 0.01;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Obdobi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Datum od
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Datum do
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSearch} disabled={isPending}>
                <Search className="h-4 w-4 mr-2" />
                {isPending ? "Nacitam..." : "Zobrazit"}
              </Button>
              <Button variant="outline" disabled>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loaded && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Ucet</TableHead>
                  <TableHead>Nazev uctu</TableHead>
                  <TableHead className="text-right">Obrat MD (Kc)</TableHead>
                  <TableHead className="text-right">Obrat D (Kc)</TableHead>
                  <TableHead className="text-right">Zustatek (Kc)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-gray-500 py-8"
                    >
                      Nebyly nalezeny zadne zauctovane zapisy pro zvolene
                      obdobi.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {Array.from(grouped.entries())
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([cls, rows]) => {
                        const classDebit = rows.reduce(
                          (sum, r) => sum + r.debit,
                          0
                        );
                        const classCredit = rows.reduce(
                          (sum, r) => sum + r.credit,
                          0
                        );

                        return (
                          <Fragment key={cls}>
                            {/* Class header */}
                            <TableRow className="bg-gray-100">
                              <TableCell
                                colSpan={5}
                                className="font-bold text-gray-700"
                              >
                                {classLabels[cls] || `Trida ${cls}`}
                              </TableCell>
                            </TableRow>

                            {/* Account rows */}
                            {rows.map((row) => {
                              const balance = row.debit - row.credit;
                              return (
                                <TableRow key={row.code}>
                                  <TableCell className="font-mono font-medium">
                                    {row.code}
                                  </TableCell>
                                  <TableCell>{row.name}</TableCell>
                                  <TableCell className="text-right font-mono">
                                    {row.debit > 0
                                      ? formatCurrency(row.debit)
                                      : ""}
                                  </TableCell>
                                  <TableCell className="text-right font-mono">
                                    {row.credit > 0
                                      ? formatCurrency(row.credit)
                                      : ""}
                                  </TableCell>
                                  <TableCell
                                    className={`text-right font-mono font-medium ${
                                      balance < 0
                                        ? "text-red-600"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {formatCurrency(balance)}
                                  </TableCell>
                                </TableRow>
                              );
                            })}

                            {/* Class subtotal */}
                            <TableRow className="bg-gray-50 border-b-2">
                              <TableCell></TableCell>
                              <TableCell className="font-medium text-gray-600">
                                Mezisouce trida {cls}
                              </TableCell>
                              <TableCell className="text-right font-mono font-medium text-gray-600">
                                {formatCurrency(classDebit)}
                              </TableCell>
                              <TableCell className="text-right font-mono font-medium text-gray-600">
                                {formatCurrency(classCredit)}
                              </TableCell>
                              <TableCell className="text-right font-mono font-medium text-gray-600">
                                {formatCurrency(classDebit - classCredit)}
                              </TableCell>
                            </TableRow>
                          </Fragment>
                        );
                      })}

                    {/* Grand totals */}
                    <TableRow className="bg-blue-50 font-bold text-lg">
                      <TableCell></TableCell>
                      <TableCell className="font-bold">Celkem</TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {formatCurrency(grandTotalDebit)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {formatCurrency(grandTotalCredit)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {formatCurrency(grandTotalDebit - grandTotalCredit)}
                      </TableCell>
                    </TableRow>

                    {/* Balance check */}
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-3">
                        {isBalanced ? (
                          <Badge variant="success">
                            Predvaha je vyrovnana (MD = D)
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            Predvaha NENI vyrovnana! Rozdil:{" "}
                            {formatCurrency(
                              Math.abs(grandTotalDebit - grandTotalCredit)
                            )}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

