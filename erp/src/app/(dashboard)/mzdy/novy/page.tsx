"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createEmployee } from "@/lib/actions/employees";

export default function NewEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    try {
      await createEmployee({
        firstName: form.get("firstName") as string,
        lastName: form.get("lastName") as string,
        email: (form.get("email") as string) || undefined,
        phone: (form.get("phone") as string) || undefined,
        position: (form.get("position") as string) || undefined,
        department: (form.get("department") as string) || undefined,
        hireDate: form.get("hireDate") as string,
        monthlySalary: form.get("monthlySalary")
          ? Number(form.get("monthlySalary"))
          : undefined,
        hourlyRate: form.get("hourlyRate")
          ? Number(form.get("hourlyRate"))
          : undefined,
        bankAccount: (form.get("bankAccount") as string) || undefined,
        street: (form.get("street") as string) || undefined,
        city: (form.get("city") as string) || undefined,
        zip: (form.get("zip") as string) || undefined,
      });
      router.push("/mzdy");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba při ukládání");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nový zaměstnanec</h1>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Osobní údaje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Jméno <span className="text-red-500">*</span>
                </label>
                <Input name="firstName" required className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Příjmení <span className="text-red-500">*</span>
                </label>
                <Input name="lastName" required className="mt-1" />
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
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">Ulice</label>
                <Input name="street" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">PSČ</label>
                <Input name="zip" className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Město</label>
              <Input name="city" className="mt-1" />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Pracovní údaje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Pozice</label>
                <Input name="position" placeholder="např. Elektrikář" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Oddělení</label>
                <Input name="department" placeholder="např. Realizace" className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Datum nástupu <span className="text-red-500">*</span>
              </label>
              <Input
                name="hireDate"
                type="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Měsíční hrubá mzda (Kč)
                </label>
                <Input
                  name="monthlySalary"
                  type="number"
                  step="100"
                  placeholder="35000"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Hodinová sazba (Kč)
                </label>
                <Input
                  name="hourlyRate"
                  type="number"
                  step="10"
                  placeholder="200"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Číslo účtu</label>
              <Input name="bankAccount" placeholder="1234567890/0100" className="mt-1" />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.push("/mzdy")}>
            Zrušit
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Ukládám..." : "Vytvořit zaměstnance"}
          </Button>
        </div>
      </form>
    </div>
  );
}
