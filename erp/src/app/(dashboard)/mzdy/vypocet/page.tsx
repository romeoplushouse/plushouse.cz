"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { calculateAllPayrolls, getPayrolls } from "@/lib/actions/employees";

export default function PayrollCalculationPage() {
  const router = useRouter();
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [payrolls, setPayrolls] = useState<Awaited<ReturnType<typeof getPayrolls>>>([]);
  const [loading, setLoading] = useState(false);
  const [calculated, setCalculated] = useState(false);

  async function handleCalculate() {
    setLoading(true);
    try {
      await calculateAllPayrolls(period);
      const results = await getPayrolls(period);
      setPayrolls(results);
      setCalculated(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Chyba při výpočtu");
    } finally {
      setLoading(false);
    }
  }

  async function handleLoad() {
    setLoading(true);
    try {
      const results = await getPayrolls(period);
      setPayrolls(results);
      setCalculated(results.length > 0);
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }

  const formatMoney = (val: number | string | { toString(): string }) =>
    Number(val).toLocaleString("cs-CZ", { minimumFractionDigits: 0 }) + " Kč";

  const totals = payrolls.reduce(
    (acc, p) => ({
      gross: acc.gross + Number(p.grossSalary),
      health: acc.health + Number(p.healthInsurance),
      social: acc.social + Number(p.socialInsurance),
      tax: acc.tax + Number(p.incomeTax),
      net: acc.net + Number(p.netSalary),
    }),
    { gross: 0, health: 0, social: 0, tax: 0, net: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Výpočet mezd</h1>
          <p className="text-gray-500">Hromadný výpočet mezd pro všechny aktivní zaměstnance</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-end gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Mzdové období</label>
              <Input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button variant="outline" onClick={handleLoad} disabled={loading}>
              Načíst existující
            </Button>
            <Button onClick={handleCalculate} disabled={loading}>
              {loading ? "Počítám..." : "Vypočítat mzdy"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {calculated && (
        <Card>
          <CardHeader>
            <CardTitle>
              Mzdy za období {period}
              <Badge variant="default" className="ml-2">
                {payrolls.length} zaměstnanců
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zaměstnanec</TableHead>
                  <TableHead className="text-right">Hrubá mzda</TableHead>
                  <TableHead className="text-right">ZP (4,5 %)</TableHead>
                  <TableHead className="text-right">SP (6,5 %)</TableHead>
                  <TableHead className="text-right">Záloha daně</TableHead>
                  <TableHead className="text-right font-bold">Čistá mzda</TableHead>
                  <TableHead>Stav</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrolls.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.employee.firstName} {p.employee.lastName}
                    </TableCell>
                    <TableCell className="text-right">{formatMoney(p.grossSalary)}</TableCell>
                    <TableCell className="text-right">{formatMoney(p.healthInsurance)}</TableCell>
                    <TableCell className="text-right">{formatMoney(p.socialInsurance)}</TableCell>
                    <TableCell className="text-right">{formatMoney(p.incomeTax)}</TableCell>
                    <TableCell className="text-right font-bold">{formatMoney(p.netSalary)}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "APPROVED" ? "success" : "secondary"}>
                        {p.status === "DRAFT" ? "Koncept" : p.status === "APPROVED" ? "Schváleno" : p.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {payrolls.length > 0 && (
                  <TableRow className="font-bold bg-gray-50">
                    <TableCell>CELKEM</TableCell>
                    <TableCell className="text-right">{formatMoney(totals.gross)}</TableCell>
                    <TableCell className="text-right">{formatMoney(totals.health)}</TableCell>
                    <TableCell className="text-right">{formatMoney(totals.social)}</TableCell>
                    <TableCell className="text-right">{formatMoney(totals.tax)}</TableCell>
                    <TableCell className="text-right">{formatMoney(totals.net)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
