import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  CreditCard,
  Users,
  Shield,
  Database,
  Bell,
} from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nastavení</h1>
        <p className="text-gray-500">Konfigurace organizace a systému</p>
      </div>

      {/* Organization Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Údaje o organizaci
          </CardTitle>
          <CardDescription>
            Základní firemní údaje pro faktury a dokumenty
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Název firmy</label>
              <Input placeholder="PLUS HOUSE s.r.o." className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">IČO</label>
              <Input placeholder="12345678" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">DIČ</label>
              <Input placeholder="CZ12345678" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <Input placeholder="info@plushouse.cz" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Ulice</label>
              <Input placeholder="Ulice 123" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Město</label>
              <Input placeholder="Brno" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">PSČ</label>
              <Input placeholder="60200" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Telefon</label>
              <Input placeholder="+420 XXX XXX XXX" className="mt-1" />
            </div>
          </div>
          <Button>Uložit údaje</Button>
        </CardContent>
      </Card>

      {/* Bank Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Bankovní spojení
          </CardTitle>
          <CardDescription>
            Nastavení bankovních účtů a napojení na notifikace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">IBAN</label>
              <Input placeholder="CZ65 0800 0000 0012 3456 7890" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Kód banky</label>
              <Input placeholder="0800" className="mt-1" />
            </div>
          </div>
          <Button>Uložit bankovní spojení</Button>
        </CardContent>
      </Card>

      {/* System Settings */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-medium">Uživatelé & Role</h3>
                <p className="text-sm text-gray-500">Správa přístupů</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-medium">Zabezpečení</h3>
                <p className="text-sm text-gray-500">2FA, hesla, session</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-medium">Zálohy dat</h3>
                <p className="text-sm text-gray-500">Export a import</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Bell className="h-8 w-8 text-orange-600" />
              <div>
                <h3 className="font-medium">Notifikace</h3>
                <p className="text-sm text-gray-500">Email, push, SOS</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
