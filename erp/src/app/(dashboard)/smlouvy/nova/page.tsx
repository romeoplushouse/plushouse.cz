"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createContract, getContractTypes } from "@/lib/actions/contracts";
import { searchContacts } from "@/lib/actions/contacts";

export default function NewContractPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [types, setTypes] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedType, setSelectedType] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [contacts, setContacts] = useState<Array<{ id: string; companyName: string | null; firstName: string | null; lastName: string | null; ico: string | null; dic: string | null; street: string | null; city: string | null; zip: string | null; email: string | null }>>([]);
  const [selectedContact, setSelectedContact] = useState<typeof contacts[0] | null>(null);

  useEffect(() => {
    getContractTypes().then(setTypes);
  }, []);

  useEffect(() => {
    if (contactSearch.length >= 2) {
      searchContacts(contactSearch).then(setContacts);
    } else {
      setContacts([]);
    }
  }, [contactSearch]);

  function selectContact(c: typeof contacts[0]) {
    setSelectedContact(c);
    setContactSearch("");
    setContacts([]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const contract = await createContract({
        type: selectedType,
        title: (form.get("title") as string) || undefined,
        partyBName: form.get("partyBName") as string,
        partyBIco: (form.get("partyBIco") as string) || undefined,
        partyBDic: (form.get("partyBDic") as string) || undefined,
        partyBAddress: (form.get("partyBAddress") as string) || undefined,
        partyBRepresentative: (form.get("partyBRepresentative") as string) || undefined,
        contactId: selectedContact?.id,
        validFrom: (form.get("validFrom") as string) || undefined,
        validTo: (form.get("validTo") as string) || undefined,
        totalAmount: form.get("totalAmount") ? Number(form.get("totalAmount")) : undefined,
        notes: (form.get("notes") as string) || undefined,
      });
      router.push(`/smlouvy/${contract.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto page-enter">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nová smlouva</h1>
      <form onSubmit={handleSubmit}>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>}

        <Card className="mb-4 rounded-xl">
          <CardHeader><CardTitle>Typ smlouvy</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {types.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setSelectedType(t.value)}
                  className={`p-3 rounded-lg border text-left text-sm transition-all ${selectedType === t.value ? "border-blue-500 bg-blue-50 text-blue-700 font-medium" : "border-gray-200 hover:border-gray-300"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4 rounded-xl">
          <CardHeader><CardTitle>Druhá smluvní strana</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <label className="text-sm font-medium text-gray-700">Vyhledat v kontaktech</label>
              <Input
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Začněte psát název firmy nebo jméno..."
                className="mt-1"
              />
              {contacts.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {contacts.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectContact(c)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                    >
                      <span className="font-medium">{c.companyName || `${c.firstName} ${c.lastName}`}</span>
                      {c.ico && <span className="text-gray-400 ml-2">IČO: {c.ico}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedContact && (
              <div className="p-3 bg-blue-50 rounded-lg text-sm">
                Vybrán: <strong>{selectedContact.companyName || `${selectedContact.firstName} ${selectedContact.lastName}`}</strong>
                {selectedContact.ico && ` • IČO: ${selectedContact.ico}`}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Název / Jméno <span className="text-red-500">*</span></label>
                <Input name="partyBName" required defaultValue={selectedContact?.companyName || `${selectedContact?.firstName ?? ""} ${selectedContact?.lastName ?? ""}`.trim()} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">IČO</label>
                <Input name="partyBIco" defaultValue={selectedContact?.ico ?? ""} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">DIČ</label>
                <Input name="partyBDic" defaultValue={selectedContact?.dic ?? ""} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Zastupující osoba</label>
                <Input name="partyBRepresentative" className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Adresa</label>
              <Input name="partyBAddress" defaultValue={[selectedContact?.street, selectedContact?.city, selectedContact?.zip].filter(Boolean).join(", ")} className="mt-1" />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4 rounded-xl">
          <CardHeader><CardTitle>Podmínky smlouvy</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Vlastní název smlouvy</label>
              <Input name="title" placeholder="Automaticky dle typu" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Platnost od</label>
                <Input name="validFrom" type="date" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Platnost do</label>
                <Input name="validTo" type="date" className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Celková částka (Kč)</label>
              <Input name="totalAmount" type="number" step="0.01" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Poznámky</label>
              <textarea name="notes" rows={2} className="mt-1 flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.push("/smlouvy")}>Zrušit</Button>
          <Button type="submit" disabled={loading || !selectedType}>
            {loading ? "Vytvářím..." : "Vytvořit smlouvu"}
          </Button>
        </div>
      </form>
    </div>
  );
}
