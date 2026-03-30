"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSubcontractor } from "@/lib/actions/subcontractors";

export default function NewSubcontractorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    try {
      await createSubcontractor({
        companyName: form.get("companyName") as string,
        ico: (form.get("ico") as string) || undefined,
        dic: (form.get("dic") as string) || undefined,
        street: (form.get("street") as string) || undefined,
        city: (form.get("city") as string) || undefined,
        zip: (form.get("zip") as string) || undefined,
        email: (form.get("email") as string) || undefined,
        phone: (form.get("phone") as string) || undefined,
        bankAccount: (form.get("bankAccount") as string) || undefined,
        specialization: (form.get("specialization") as string) || undefined,
        trade: (form.get("trade") as string) || undefined,
        hourlyRate: form.get("hourlyRate") ? Number(form.get("hourlyRate")) : undefined,
        dailyRate: form.get("dailyRate") ? Number(form.get("dailyRate")) : undefined,
        notes: (form.get("notes") as string) || undefined,
      });
      router.push("/subdodavatele");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba při ukládání");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nový subdodavatel</h1>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md mb-4">{error}</div>
        )}

        <Card className="mb-4">
          <CardHeader><CardTitle>Firemní údaje</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Název firmy <span className="text-red-500">*</span>
              </label>
              <Input name="companyName" required className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">IČO</label>
                <Input name="ico" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">DIČ</label>
                <Input name="dic" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input name="email" type="email" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Telefon</label>
                <Input name="phone" className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Ulice</label>
              <Input name="street" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Město</label>
                <Input name="city" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">PSČ</label>
                <Input name="zip" className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Číslo účtu</label>
              <Input name="bankAccount" className="mt-1" />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader><CardTitle>Specializace a ceník</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Specializace</label>
                <Input name="specialization" placeholder="např. Elektro, SDK, Obklady" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Obor</label>
                <Input name="trade" placeholder="např. Stavebnictví" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Hodinová sazba (Kč)</label>
                <Input name="hourlyRate" type="number" step="10" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Denní sazba (Kč)</label>
                <Input name="dailyRate" type="number" step="100" className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Poznámky</label>
              <textarea
                name="notes"
                className="mt-1 flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.push("/subdodavatele")}>
            Zrušit
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Ukládám..." : "Vytvořit subdodavatele"}
          </Button>
        </div>
      </form>
    </div>
  );
}
