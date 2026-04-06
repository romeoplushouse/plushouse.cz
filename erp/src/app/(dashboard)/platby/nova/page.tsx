"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { recordPayment } from "@/lib/actions/payments";

export default function NewPaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    try {
      await recordPayment({
        date: form.get("date") as string,
        amount: Number(form.get("amount")),
        type: form.get("type") as "INCOMING" | "OUTGOING",
        method: form.get("method") as "BANK_TRANSFER" | "CASH" | "CARD" | "QR_PAYMENT" | "OTHER",
        variableSymbol: (form.get("variableSymbol") as string) || undefined,
        bankReference: (form.get("bankReference") as string) || undefined,
        note: (form.get("note") as string) || undefined,
      });
      router.push("/platby");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba při ukládání");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Nová platba</h1>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-500/10 text-red-400 text-sm p-3 rounded-md mb-4">{error}</div>
        )}

        <Card className="mb-4">
          <CardHeader><CardTitle>Údaje o platbě</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-400">Typ platby <span className="text-red-500">*</span></label>
              <select name="type" required className="mt-1 flex h-10 w-full rounded-md border border-[#2a2d35] bg-[#1a1d24] text-white px-3 py-2 text-sm">
                <option value="INCOMING">Příjem (přijatá platba)</option>
                <option value="OUTGOING">Výdaj (odchozí platba)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Datum <span className="text-red-500">*</span></label>
                <Input name="date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Částka (Kč) <span className="text-red-500">*</span></label>
                <Input name="amount" type="number" step="0.01" required className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400">Způsob platby <span className="text-red-500">*</span></label>
              <select name="method" required className="mt-1 flex h-10 w-full rounded-md border border-[#2a2d35] bg-[#1a1d24] text-white px-3 py-2 text-sm">
                <option value="BANK_TRANSFER">Bankovní převod</option>
                <option value="CASH">Hotově</option>
                <option value="CARD">Kartou</option>
                <option value="QR_PAYMENT">QR platba</option>
                <option value="OTHER">Jiný</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Variabilní symbol</label>
                <Input name="variableSymbol" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Reference banky</label>
                <Input name="bankReference" className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400">Poznámka</label>
              <textarea
                name="note"
                className="mt-1 flex w-full rounded-md border border-[#2a2d35] bg-[#1a1d24] text-white px-3 py-2 text-sm"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.push("/platby")}>
            Zrušit
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Ukládám..." : "Zaznamenat platbu"}
          </Button>
        </div>
      </form>
    </div>
  );
}
