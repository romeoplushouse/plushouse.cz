export const dynamic = "force-dynamic";
import { getEmployees } from "@/lib/actions/employees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Banknote, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default async function PayrollPage() {
  const { employees, total } = await getEmployees();

  const totalSalary = employees.reduce(
    (sum, e) => sum + Number(e.monthlySalary ?? 0),
    0
  );

  const now = new Date();
  const currentPeriod = `${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Zaměstnanci &amp; Mzdy</h1>
          <p className="text-gray-500">Evidence zaměstnanců, výpočet mezd, výplatní pásky</p>
        </div>
        <div className="flex gap-2">
          <Link href="/mzdy/vypocet">
            <Button variant="outline">
              <Calculator className="h-4 w-4 mr-2" />
              Výpočet mezd
            </Button>
          </Link>
          <Link href="/mzdy/novy">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nový zaměstnanec
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-blue-400" />
              <div>
                <p className="text-sm text-gray-500">Aktivní zaměstnanci</p>
                <p className="text-xl font-bold">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Banknote className="h-6 w-6 text-emerald-400" />
              <div>
                <p className="text-sm text-gray-500">Mzdové náklady (měsíc)</p>
                <p className="text-xl font-bold">{formatCurrency(totalSalary)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-purple-400" />
              <div>
                <p className="text-sm text-gray-500">Aktuální období</p>
                <p className="text-xl font-bold">{currentPeriod}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Zaměstnanci</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Č. zaměstnance</TableHead>
                <TableHead>Jméno</TableHead>
                <TableHead>Pozice</TableHead>
                <TableHead>Oddělení</TableHead>
                <TableHead>Nástup</TableHead>
                <TableHead className="text-right">Hrubá mzda</TableHead>
                <TableHead>Stav</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium">Zatím žádní zaměstnanci</p>
                    <p className="text-sm mt-1">
                      <Link href="/mzdy/novy" className="text-[#B5E126] hover:underline">
                        Přidejte prvního zaměstnance
                      </Link>
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-mono">{emp.employeeNumber}</TableCell>
                    <TableCell>
                      <Link href={`/mzdy/${emp.id}`} className="text-[#B5E126] hover:underline font-medium">
                        {emp.firstName} {emp.lastName}
                      </Link>
                    </TableCell>
                    <TableCell>{emp.position ?? "—"}</TableCell>
                    <TableCell>{emp.department ?? "—"}</TableCell>
                    <TableCell>{new Date(emp.hireDate).toLocaleDateString("cs-CZ")}</TableCell>
                    <TableCell className="text-right">
                      {emp.monthlySalary ? formatCurrency(Number(emp.monthlySalary)) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={emp.isActive ? "success" : "secondary"}>
                        {emp.isActive ? "Aktivní" : "Ukončen"}
                      </Badge>
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

function Calculator(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="16" height="20" x="4" y="2" rx="2" /><line x1="8" x2="16" y1="6" y2="6" /><line x1="16" x2="16" y1="14" y2="18" /><path d="M16 10h.01" /><path d="M12 10h.01" /><path d="M8 10h.01" /><path d="M12 14h.01" /><path d="M8 14h.01" /><path d="M12 18h.01" /><path d="M8 18h.01" />
    </svg>
  );
}
