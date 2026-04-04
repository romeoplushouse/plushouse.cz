export const dynamic = "force-dynamic";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, CreditCard, Users, FolderKanban, TrendingUp, TrendingDown,
  AlertTriangle, Clock, ArrowUpRight, ArrowDownRight, Plus, UserPlus,
  Briefcase, CalendarDays, Wallet, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { getDashboardStats } from "@/lib/actions/settings";
import { formatCurrency, formatDate } from "@/lib/utils";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Dobré ráno";
  if (hour < 18) return "Dobré odpoledne";
  return "Dobrý večer";
}

function getCzechDate(): string {
  return new Intl.DateTimeFormat("cs-CZ", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const balance = stats.incomeThisMonth - stats.expensesThisMonth;

  return (
    <div className="page-enter space-y-6">
      {/* Welcome Section */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {getGreeting()}
          </h1>
          <p className="text-gray-400 font-medium mt-1 flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            {getCzechDate()}
          </p>
        </div>
        <Badge variant="outline" className="text-gray-500 font-medium hidden sm:flex border-[#2a2d35]">
          PlusHouse ERP
        </Badge>
      </div>

      {/* Primary Stats Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Unpaid Invoices */}
        <Card className="card-hover overflow-hidden rounded-2xl border-[#2a2d35] shadow-none">
          <div className="flex">
            <div className="w-1 shrink-0 bg-gradient-to-b from-[#B5E126] to-[#B5E126]/50" />
            <CardContent className="p-5 flex-1">
              <p className="text-3xl font-bold text-white tracking-tight">
                {stats.unpaidInvoices}
              </p>
              <p className="text-sm font-medium text-gray-400 mt-1">
                Neuhrazené faktury
              </p>
              {stats.overdueInvoices > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="h-3.5 w-3.5 text-red-400" />
                  <span className="text-xs font-semibold text-red-400">
                    {stats.overdueInvoices} po splatnosti
                  </span>
                </div>
              )}
              {stats.overdueInvoices === 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs font-medium text-gray-500">
                    Vše v pořádku
                  </span>
                </div>
              )}
            </CardContent>
          </div>
        </Card>

        {/* Income This Month */}
        <Card className="card-hover overflow-hidden rounded-2xl border-[#2a2d35] shadow-none">
          <div className="flex">
            <div className="w-1 shrink-0 bg-gradient-to-b from-emerald-400 to-emerald-400/50" />
            <CardContent className="p-5 flex-1">
              <p className="text-3xl font-bold text-white tracking-tight">
                {formatCurrency(stats.incomeThisMonth)}
              </p>
              <p className="text-sm font-medium text-gray-400 mt-1">
                Příjmy tento měsíc
              </p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">
                  Příchozí platby
                </span>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Expenses This Month */}
        <Card className="card-hover overflow-hidden rounded-2xl border-[#2a2d35] shadow-none">
          <div className="flex">
            <div className="w-1 shrink-0 bg-gradient-to-b from-red-400 to-red-400/50" />
            <CardContent className="p-5 flex-1">
              <p className="text-3xl font-bold text-white tracking-tight">
                {formatCurrency(stats.expensesThisMonth)}
              </p>
              <p className="text-sm font-medium text-gray-400 mt-1">
                Výdaje tento měsíc
              </p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                <span className="text-xs font-semibold text-red-400">
                  Odchozí platby
                </span>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Active Projects */}
        <Card className="card-hover overflow-hidden rounded-2xl border-[#2a2d35] shadow-none">
          <div className="flex">
            <div className="w-1 shrink-0 bg-gradient-to-b from-purple-400 to-purple-400/50" />
            <CardContent className="p-5 flex-1">
              <p className="text-3xl font-bold text-white tracking-tight">
                {stats.activeProjects}
              </p>
              <p className="text-sm font-medium text-gray-400 mt-1">
                Aktivní zakázky
              </p>
              <div className="flex items-center gap-1 mt-2">
                <FolderKanban className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-xs font-semibold text-purple-400">
                  Rozpracované
                </span>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card className="card-hover stat-card-blue overflow-hidden rounded-2xl border-[#2a2d35] shadow-none">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Kontakty</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.totalContacts}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover stat-card-green overflow-hidden rounded-2xl border-[#2a2d35] shadow-none">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Zaměstnanci</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.activeEmployees}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10">
                <Briefcase className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover stat-card-purple overflow-hidden rounded-2xl border-[#2a2d35] shadow-none">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Bilance</p>
                <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {formatCurrency(balance)}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-500/10">
                <Wallet className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts + Recent Payments */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Alerts */}
        <Card className="overflow-hidden rounded-2xl border-[#2a2d35] shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold">Upozornění</CardTitle>
            <CardDescription>Důležité události vyžadující pozornost</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.overdueInvoices > 0 && (
                <Link
                  href="/faktury?status=OVERDUE"
                  className="flex items-center gap-3 p-4 rounded-xl transition-all hover:shadow-md hover:shadow-[#B5E126]/5 group bg-red-500/5 border border-red-500/10"
                >
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-200">
                      {stats.overdueInvoices} {stats.overdueInvoices === 1 ? "faktura" : stats.overdueInvoices < 5 ? "faktury" : "faktur"} po splatnosti
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Vyžaduje okamžitou pozornost
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                </Link>
              )}

              <div className="flex items-center gap-3 p-4 rounded-xl bg-[#B5E126]/5 border border-[#B5E126]/10">
                <div className="p-2 rounded-lg bg-[#B5E126]/10">
                  <Clock className="h-4 w-4 text-[#B5E126]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-200">
                    Přiznání k DPH
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Termín: 25. dne následujícího měsíce
                  </p>
                </div>
              </div>

              {stats.totalContacts === 0 && (
                <Link
                  href="/crm/novy"
                  className="flex items-center gap-3 p-4 rounded-xl transition-all hover:shadow-md hover:shadow-[#B5E126]/5 group bg-amber-500/5 border border-amber-500/10"
                >
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-200">
                      Přidejte první kontakt
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Začněte vytvořením zákazníka nebo dodavatele
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                </Link>
              )}

              {stats.overdueInvoices === 0 && stats.totalContacts > 0 && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-200">
                      Vše v pořádku
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Žádné urgentní položky
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="overflow-hidden rounded-2xl border-[#2a2d35] shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Poslední platby</CardTitle>
                <CardDescription>Nedávné finanční pohyby</CardDescription>
              </div>
              <Link
                href="/platby"
                className="text-xs font-semibold text-[#B5E126] hover:text-[#b5e154] transition-colors flex items-center gap-1"
              >
                Zobrazit vše
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentPayments.length === 0 ? (
              <div className="text-center py-10">
                <div className="p-3 rounded-2xl bg-[#1a1d24] inline-block mb-3">
                  <CreditCard className="h-6 w-6 text-gray-500" />
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  Zatím žádné platby
                </p>
                <Link
                  href="/platby/nova"
                  className="text-sm font-semibold text-[#B5E126] hover:text-[#b5e154] transition-colors"
                >
                  Zaznamenejte první platbu
                </Link>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-[#2a2d35]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#0f1117]">
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-400 text-xs uppercase tracking-wider">
                        Subjekt
                      </th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-400 text-xs uppercase tracking-wider">
                        Datum
                      </th>
                      <th className="text-right px-4 py-2.5 font-semibold text-gray-400 text-xs uppercase tracking-wider">
                        Částka
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentPayments.map((p, idx) => (
                      <tr
                        key={p.id}
                        className={`border-t border-[#2a2d35]/50 transition-colors hover:bg-[#B5E126]/5 ${
                          idx % 2 === 1 ? "bg-[#0f1117]/30" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-200">
                            {p.contact
                              ? p.contact.companyName || `${p.contact.firstName ?? ""} ${p.contact.lastName ?? ""}`.trim()
                              : p.invoice?.invoiceNumber ?? "Platba"
                            }
                          </p>
                        </td>
                        <td className="px-4 py-3 text-gray-400 font-medium">
                          {formatDate(p.date)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`font-semibold ${
                              p.type === "INCOMING" ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            {p.type === "INCOMING" ? "+" : "-"}
                            {formatCurrency(Number(p.amount))}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-bold text-white mb-4">Rychlé akce</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/faktury/nova" className="group">
            <Card className="card-hover overflow-hidden rounded-2xl border-[#2a2d35] shadow-none transition-all group-hover:shadow-md group-hover:shadow-[#B5E126]/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-[#B5E126]/10 shadow-sm">
                    <Plus className="h-5 w-5 text-[#B5E126]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-200 group-hover:text-[#B5E126] transition-colors">
                      Nová faktura
                    </h3>
                    <p className="text-sm text-gray-500 font-medium mt-1">
                      Vystavit fakturu zákazníkovi
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-600 group-hover:text-[#B5E126] transition-colors mt-0.5" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/crm/novy" className="group">
            <Card className="card-hover overflow-hidden rounded-2xl border-[#2a2d35] shadow-none transition-all group-hover:shadow-md group-hover:shadow-[#B5E126]/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 shadow-sm">
                    <UserPlus className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-200 group-hover:text-[#B5E126] transition-colors">
                      Nový kontakt
                    </h3>
                    <p className="text-sm text-gray-500 font-medium mt-1">
                      Přidat zákazníka nebo dodavatele
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-600 group-hover:text-[#B5E126] transition-colors mt-0.5" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/zakazky/nova" className="group">
            <Card className="card-hover overflow-hidden rounded-2xl border-[#2a2d35] shadow-none transition-all group-hover:shadow-md group-hover:shadow-[#B5E126]/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-purple-500/10 shadow-sm">
                    <FolderKanban className="h-5 w-5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-200 group-hover:text-[#B5E126] transition-colors">
                      Nová zakázka
                    </h3>
                    <p className="text-sm text-gray-500 font-medium mt-1">
                      Vytvořit nový projekt
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-600 group-hover:text-[#B5E126] transition-colors mt-0.5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
