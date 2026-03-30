"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, CreditCard, Users, Shield, Database, Bell } from "lucide-react";
import { getOrganization, saveOrganization } from "@/lib/actions/settings";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [org, setOrg] = useState({
    name: "", ico: "", dic: "", street: "", city: "", zip: "",
    country: "CZ", phone: "", email: "", website: "",
    bankAccount: "", bankCode: "", registrationNote: "",
  });

  useEffect(() => {
    loadOrg();
  }, []);

  async function loadOrg() {
    const data = await getOrganization();
    if (data) {
      setOrg({
        name: data.name ?? "",
        ico: data.ico ?? "",
        dic: data.dic ?? "",
        street: data.street ?? "",
        city: data.city ?? "",
        zip: data.zip ?? "",
        country: data.country ?? "CZ",
        phone: data.phone ?? "",
        email: data.email ?? "",
        website: data.website ?? "",
        bankAccount: data.bankAccount ?? "",
        bankCode: data.bankCode ?? "",
        registrationNote: data.registrationNote ?? "",
      });
    }
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await saveOrganization(org);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Chyba při ukládání");
    } finally {
      setSaving(false);
    }
  }

  function updateField(field: string, value: string) {
    setOrg((prev) => ({ ...prev, [field]: value }));
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Načítám...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nastavení</h1>
        <p className="text-gray-500">Konfigurace organizace a systému</p>
      </div>

      <form onSubmit={handleSave}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Údaje o organizaci
            </CardTitle>
            <CardDescription>Základní firemní údaje pro faktury a dokumenty</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Název firmy</label>
                <Input value={org.name} onChange={(e) => updateField("name", e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">IČO</label>
                <Input value={org.ico} onChange={(e) => updateField("ico", e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">DIČ</label>
                <Input value={org.dic} onChange={(e) => updateField("dic", e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input value={org.email} onChange={(e) => updateField("email", e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Ulice</label>
                <Input value={org.street} onChange={(e) => updateField("street", e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Město</label>
                <Input value={org.city} onChange={(e) => updateField("city", e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">PSČ</label>
                <Input value={org.zip} onChange={(e) => updateField("zip", e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Telefon</label>
                <Input value={org.phone} onChange={(e) => updateField("phone", e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Web</label>
                <Input value={org.website} onChange={(e) => updateField("website", e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Zápis v OR</label>
                <Input value={org.registrationNote} onChange={(e) => updateField("registrationNote", e.target.value)} className="mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Bankovní spojení
            </CardTitle>
            <CardDescription>Pro faktury a platby</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">IBAN / Číslo účtu</label>
                <Input value={org.bankAccount} onChange={(e) => updateField("bankAccount", e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Kód banky</label>
                <Input value={org.bankCode} onChange={(e) => updateField("bankCode", e.target.value)} className="mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Ukládám..." : "Uložit nastavení"}
          </Button>
          {saved && (
            <span className="text-green-600 text-sm font-medium">Uloženo!</span>
          )}
        </div>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-medium">Uživatelé &amp; Role</h3>
                <p className="text-sm text-gray-500">Admin, Účetní, Manažer, Pracovník</p>
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
                <p className="text-sm text-gray-500">Export a import databáze</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
