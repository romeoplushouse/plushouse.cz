import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { czechChartOfAccounts } from "@/lib/czech-chart-of-accounts";

const typeLabels: Record<string, string> = {
  ASSET: "Aktiva",
  LIABILITY: "Pasiva",
  EQUITY: "Vlastní kapitál",
  REVENUE: "Výnosy",
  EXPENSE: "Náklady",
};

const typeColors: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  ASSET: "default",
  LIABILITY: "warning",
  EQUITY: "secondary",
  REVENUE: "success",
  EXPENSE: "destructive",
};

export default function ChartOfAccountsPage() {
  // Group accounts by their group field
  const groups = new Map<string, typeof czechChartOfAccounts>();
  for (const account of czechChartOfAccounts) {
    if (!groups.has(account.group)) {
      groups.set(account.group, []);
    }
    groups.get(account.group)!.push(account);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Účtový rozvrh</h1>
        <p className="text-gray-500">
          Český standardní účtový rozvrh dle vyhlášky č. 500/2002 Sb.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {czechChartOfAccounts.filter((a) => a.type === "ASSET").length}
            </p>
            <p className="text-sm text-gray-500">Aktiva</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {czechChartOfAccounts.filter((a) => a.type === "LIABILITY").length}
            </p>
            <p className="text-sm text-gray-500">Pasiva</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-600">
              {czechChartOfAccounts.filter((a) => a.type === "EQUITY").length}
            </p>
            <p className="text-sm text-gray-500">Vlastní kapitál</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {czechChartOfAccounts.filter((a) => a.type === "REVENUE").length}
            </p>
            <p className="text-sm text-gray-500">Výnosy</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">
              {czechChartOfAccounts.filter((a) => a.type === "EXPENSE").length}
            </p>
            <p className="text-sm text-gray-500">Náklady</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Kód</TableHead>
                <TableHead>Název účtu</TableHead>
                <TableHead>Skupina</TableHead>
                <TableHead>Typ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {czechChartOfAccounts.map((account) => (
                <TableRow key={account.code}>
                  <TableCell className="font-mono font-medium">
                    {account.code}
                  </TableCell>
                  <TableCell>{account.name}</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {account.group}
                  </TableCell>
                  <TableCell>
                    <Badge variant={typeColors[account.type]}>
                      {typeLabels[account.type]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
