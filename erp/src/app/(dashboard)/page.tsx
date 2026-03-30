export const dynamic = "force-dynamic";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, CreditCard, Users, FolderKanban, TrendingUp, TrendingDown,
  AlertTriangle, Clock,
} from "lucide-react";
import Link from "next/link";
import { getDashboardStats } from "@/lib/actions/settings";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Přehled</h1>
        <p className="text-gray-500">Vítejte v PlusHouse ERP systému</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Neuhrazené faktury</p>
                <p className="text-2xl font-bold mt-1">{stats.unpaidInvoices}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {stats.overdueInvoices > 0 && (
                    <span className="text-red-500">{stats.overdueInvoices} po splatnosti</span>
                  )}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Příjmy tento měsíc</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(stats.incomeThisMonth)}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Výdaje tento měsíc</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(stats.expensesThisMonth)}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Aktivní zakázky</p>
                <p className="text-2xl font-bold mt-1">{stats.activeProjects}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <FolderKanban className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Kontakty</p>
                <p className="text-xl font-bold">{stats.totalContacts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Zaměstnanci</p>
                <p className="text-xl font-bold">{stats.activeEmployees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">Bilance</p>
                <p className={`text-xl font-bold ${stats.incomeThisMonth - stats.expensesThisMonth >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(stats.incomeThisMonth - stats.expensesThisMonth)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upozornění</CardTitle>
            <CardDescription>Důležité události vyžadující pozornost</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.overdueInvoices > 0 && (
                <Link href="/faktury?status=OVERDUE" className="flex items-center gap-3 p-3 bg-red-50 rounded-lg hover:bg-red-100 transition">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium">{stats.overdueInvoices} faktur po splatnosti</p>
                    <p className="text-xs text-gray-500">Klikněte pro zobrazení</p>
                  </div>
                </Link>
              )}
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Přiznání k DPH</p>
                  <p className="text-xs text-gray-500">Termín: 25. dne následujícího měsíce</p>
                </div>
              </div>
              {stats.totalContacts === 0 && (
                <Link href="/crm/novy" className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium">Přidejte první kontakt</p>
                    <p className="text-xs text-gray-500">Začněte vytvořením zákazníka nebo dodavatele</p>
                  </div>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Poslední platby</CardTitle>
            <CardDescription>Nedávné finanční pohyby</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentPayments.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-8">
                Zatím žádné platby.{" "}
                <Link href="/platby/nova" className="text-blue-600 hover:underline">
                  Zaznamenejte první platbu
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">
                        {p.contact
                          ? p.contact.companyName || `${p.contact.firstName ?? ""} ${p.contact.lastName ?? ""}`
                          : p.invoice?.invoiceNumber ?? "Platba"
                        }
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(p.date)}</p>
                    </div>
                    <span className={`font-bold text-sm ${p.type === "INCOMING" ? "text-green-600" : "text-red-600"}`}>
                      {p.type === "INCOMING" ? "+" : "-"}{formatCurrency(Number(p.amount))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/faktury/nova">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Nová faktura</h3>
                  <p className="text-sm text-gray-500">Vystavit fakturu zákazníkovi</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/crm/novy">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Nový kontakt</h3>
                  <p className="text-sm text-gray-500">Přidat zákazníka nebo dodavatele</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/zakazky/nova">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <FolderKanban className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">Nová zakázka</h3>
                  <p className="text-sm text-gray-500">Vytvořit nový projekt</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
