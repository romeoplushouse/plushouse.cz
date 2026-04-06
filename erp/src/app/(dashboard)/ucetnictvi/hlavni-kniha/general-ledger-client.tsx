"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccountSelector } from "@/components/accounting/account-selector";
import { Search } from "lucide-react";
import { getGeneralLedger } from "@/lib/actions/accounting";
import { formatCurrency, formatDate } from "@/lib/utils";

type Account = {
  code: string;
  name: string;
  type: string;
  group: string | null;
};

type LedgerEntry = {
  id: string;
  date: string;
  entryNumber: string;
  description: string;
  documentRef: string | null;
  debit: number;
  credit: number;
};

export function GeneralLedgerClient({ accounts }: { accounts: Account[] }) {
  const [selectedAccount, setSelectedAccount] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const account = accounts.find((a) => a.code === selectedAccount);

  function handleSearch() {
    if (!selectedAccount) return;
    startTransition(async () => {
      const data = await getGeneralLedger(
        selectedAccount,
        dateFrom || undefined,
        dateTo || undefined
      );
      setEntries(data);
      setLoaded(true);
    });
  }

  // Calculate running balance
  let runningBalance = 0;
  const entriesWithBalance = entries.map((entry) => {
    runningBalance += entry.debit - entry.credit;
    return { ...entry, balance: runningBalance };
  });

  const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtr</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 items-end">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Ucet *
              </label>
              <AccountSelector
                accounts={accounts}
                value={selectedAccount}
                onChange={setSelectedAccount}
                placeholder="Vyberte ucet..."
              />
            </div>
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
          </div>
          <div className="mt-4">
            <Button
              onClick={handleSearch}
              disabled={!selectedAccount || isPending}
            >
              <Search className="h-4 w-4 mr-2" />
              {isPending ? "Nacitam..." : "Zobrazit"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loaded && (
        <Card>
          <CardHeader>
            <CardTitle>
              {account
                ? `${account.code} - ${account.name}`
                : "Hlavni kniha"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Cislo zapisu</TableHead>
                  <TableHead>Popis</TableHead>
                  <TableHead>Doklad</TableHead>
                  <TableHead className="text-right">MD (Kc)</TableHead>
                  <TableHead className="text-right">D (Kc)</TableHead>
                  <TableHead className="text-right">Zustatek (Kc)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entriesWithBalance.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-gray-500 py-8"
                    >
                      Pro tento ucet nebyly nalezeny zadne zauctovane zapisy.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {entriesWithBalance.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{formatDate(entry.date)}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {entry.entryNumber}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {entry.description}
                        </TableCell>
                        <TableCell>
                          {entry.documentRef || (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : ""}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.credit > 0
                            ? formatCurrency(entry.credit)
                            : ""}
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono font-medium ${
                            entry.balance < 0
                              ? "text-red-400"
                              : "text-white"
                          }`}
                        >
                          {formatCurrency(entry.balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Totals row */}
                    <TableRow className="bg-[#1a1d24] font-bold">
                      <TableCell colSpan={4} className="text-right">
                        Celkem
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(totalDebit)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(totalCredit)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono ${
                          runningBalance < 0 ? "text-red-400" : "text-white"
                        }`}
                      >
                        {formatCurrency(runningBalance)}
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
