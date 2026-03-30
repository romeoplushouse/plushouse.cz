import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  CreditCard,
  Users,
  FolderKanban,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
} from "lucide-react";

const stats = [
  {
    title: "Neuhrazené faktury",
    value: "0",
    change: "Vydané",
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Příjmy tento měsíc",
    value: "0 Kč",
    change: "+0 %",
    icon: TrendingUp,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    title: "Výdaje tento měsíc",
    value: "0 Kč",
    change: "+0 %",
    icon: TrendingDown,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  {
    title: "Aktivní zakázky",
    value: "0",
    change: "V realizaci",
    icon: FolderKanban,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Přehled</h1>
        <p className="text-gray-500">
          Vítejte v PlusHouse ERP systému
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upozornění</CardTitle>
            <CardDescription>Důležité události vyžadující pozornost</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium">Nastavte organizaci</p>
                  <p className="text-xs text-gray-500">
                    Vyplňte údaje o vaší firmě v Nastavení
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Přiznání k DPH</p>
                  <p className="text-xs text-gray-500">
                    Termín pro podání: 25. dne následujícího měsíce
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Poslední aktivita</CardTitle>
            <CardDescription>Nedávné události v systému</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500 text-center py-8">
              Zatím žádná aktivita. Začněte přidáním kontaktu nebo vytvořením faktury.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Fakturace</h3>
                <p className="text-sm text-gray-500">
                  Faktury, nabídky, zálohy, daňové doklady
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">CRM & Adresář</h3>
                <p className="text-sm text-gray-500">
                  Zákazníci, dodavatelé, subdodavatelé
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium">Platby & Banka</h3>
                <p className="text-sm text-gray-500">
                  Bankovní notifikace, QR platby, párování
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
