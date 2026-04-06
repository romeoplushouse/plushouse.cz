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
  "0": "Třída 0 – Dlouhodobý majetek",
  "1": "Třída 1 – Zásoby",
  "2": "Třída 2 – Krátkodobý finanční majetek",
  "3": "Třída 3 – Zúčtovací vztahy",
  "4": "Třída 4 – Kapitálové účty",
  "5": "Třída 5 – Náklady",
  "6": "Třída 6 – Výnosy",
  "7": "Třída 7 – Závěrkové účty",
};

export function TrialBalanceClient() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [data, setData] = useState<TrialBalanceRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

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

  const grouped = new Map<string, TrialBalanceRow[]>();
  for (const row of data) {
    const cls = row.code.charAt(0);
    if (!grouped.has(cls)) grouped.set(cls, []);
    grouped.get(cls)!.push(row);
  }

  const grandTotalDebit = data.reduce((sum, r) => sum + r.debit, 0);
  const grandTotalCredit = data.reduce((sum, r) => sum + r.credit, 0);
  const isBalanced = Math.abs(grandTotalDebit - grandTotalCredit) < 0.01;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Období</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Datum od
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
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
                {isPending ? "Načítám..." : "Zobrazit"}
              </Button>
              <Button variant="outline" disabled>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loaded && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Účet</TableHead>
                  <TableHead>Název účtu</TableHead>
                  <TableHead className="text-right">Obrat MD (Kč)</TableHead>
                  <TableHead className="text-right">Obrat D (Kč)</TableHead>
                  <TableHead className="text-right">Zůstatek (Kč)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-gray-500 py-8"
                    >
                      Nebyly nalezeny žádné zaúčtované zápisy pro zvolené období.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {Array.from(grouped.entries())
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([cls, rows]) => {
                        const classDebit = rows.reduce((sum, r) => sum + r.debit, 0);
                        const classCredit = rows.reduce((sum, r) => sum + r.credit, 0);

                        return (
                          <Fragment key={cls}>
                            <TableRow className="bg-[#0f1117]">
                              <TableCell colSpan={5} className="font-bold text-[#B5E126]">
                                {classLabels[cls] || `Třída ${cls}`}
                              </TableCell>
                            </TableRow>

                            {rows.map((row) => {
                              const balance = row.debit - row.credit;
                              return (
                                <TableRow key={row.code}>
                                  <TableCell className="font-mono font-medium text-gray-200">
                                    {row.code}
                                  </TableCell>
                                  <TableCell className="text-gray-300">{row.name}</TableCell>
                                  <TableCell className="text-right font-mono text-gray-300">
                                    {row.debit > 0 ? formatCurrency(row.debit) : ""}
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-gray-300">
                                    {row.credit > 0 ? formatCurrency(row.credit) : ""}
                                  </TableCell>
                                  <TableCell
                                    className={`text-right font-mono font-medium ${
                                      balance < 0 ? "text-red-400" : "text-gray-100"
                                    }`}
                                  >
                                    {formatCurrency(balance)}
                                  </TableCell>
                                </TableRow>
                              );
                            })}

                            <TableRow className="bg-[#1a1d24]/50 border-b-2 border-[#2a2d35]">
                              <TableCell></TableCell>
                              <TableCell className="font-medium text-gray-400">
                                Mezisoučet třída {cls}
                              </TableCell>
                              <TableCell className="text-right font-mono font-medium text-gray-400">
                                {formatCurrency(classDebit)}
                              </TableCell>
                              <TableCell className="text-right font-mono font-medium text-gray-400">
                                {formatCurrency(classCredit)}
                              </TableCell>
                              <TableCell className="text-right font-mono font-medium text-gray-400">
                                {formatCurrency(classDebit - classCredit)}
                              </TableCell>
                            </TableRow>
                          </Fragment>
                        );
                      })}

                    <TableRow className="bg-[#B5E126]/5 font-bold text-lg">
                      <TableCell></TableCell>
                      <TableCell className="font-bold text-white">Celkem</TableCell>
                      <TableCell className="text-right font-mono font-bold text-white">
                        {formatCurrency(grandTotalDebit)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-white">
                        {formatCurrency(grandTotalCredit)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-white">
                        {formatCurrency(grandTotalDebit - grandTotalCredit)}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-3">
                        {isBalanced ? (
                          <Badge variant="success">
                            Předvaha je vyrovnaná (MD = D)
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            Předvaha NENÍ vyrovnaná! Rozdíl:{" "}
                            {formatCurrency(Math.abs(grandTotalDebit - grandTotalCredit))}
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
