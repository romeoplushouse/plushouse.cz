"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { createProject } from "@/lib/actions/projects";
import { searchContacts } from "@/lib/actions/contacts";

type ContactResult = {
  id: string;
  companyName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
};

export default function NewProjectPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Contact search
  const [contactQuery, setContactQuery] = useState("");
  const [contactResults, setContactResults] = useState<ContactResult[]>([]);
  const [selectedContact, setSelectedContact] = useState<ContactResult | null>(
    null
  );
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [searchingContacts, setSearchingContacts] = useState(false);

  async function handleContactSearch(query: string) {
    setContactQuery(query);
    if (query.length < 2) {
      setContactResults([]);
      setShowContactDropdown(false);
      return;
    }
    setSearchingContacts(true);
    try {
      const results = await searchContacts(query);
      setContactResults(results as ContactResult[]);
      setShowContactDropdown(true);
    } catch {
      setContactResults([]);
    } finally {
      setSearchingContacts(false);
    }
  }

  function selectContact(contact: ContactResult) {
    setSelectedContact(contact);
    setContactQuery(
      contact.companyName ||
        [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
        ""
    );
    setShowContactDropdown(false);
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    const name = formData.get("name") as string;
    if (!name?.trim()) {
      setError("N\u00e1zev zak\u00e1zky je povinn\u00fd");
      return;
    }

    startTransition(async () => {
      try {
        const budgetStr = formData.get("budget") as string;
        const latStr = formData.get("lat") as string;
        const lngStr = formData.get("lng") as string;

        const project = await createProject({
          name: name.trim(),
          description: (formData.get("description") as string) || undefined,
          contactId: selectedContact?.id || undefined,
          startDate: (formData.get("startDate") as string) || undefined,
          endDate: (formData.get("endDate") as string) || undefined,
          budget: budgetStr ? parseFloat(budgetStr) : undefined,
          address: (formData.get("address") as string) || undefined,
          lat: latStr ? parseFloat(latStr) : undefined,
          lng: lngStr ? parseFloat(lngStr) : undefined,
        });
        router.push(`/zakazky/${project.id}`);
      } catch {
        setError("Nepoda\u0159ilo se vytvo\u0159it zak\u00e1zku. Zkuste to znovu.");
      }
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/zakazky">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Nov\u00e1 zak\u00e1zka
          </h1>
          <p className="text-gray-500">Vytvo\u0159te novou zak\u00e1zku</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Z\u00e1kladn\u00ed \u00fadaje</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                N\u00e1zev zak\u00e1zky *
              </label>
              <Input name="name" placeholder="Nap\u0159. Rekonstrukce koupelny" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Popis
              </label>
              <textarea
                name="description"
                rows={3}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Popis zak\u00e1zky..."
              />
            </div>

            {/* Contact search */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Z\u00e1kazn\u00edk / Kontakt
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={contactQuery}
                  onChange={(e) => handleContactSearch(e.target.value)}
                  onFocus={() =>
                    contactResults.length > 0 && setShowContactDropdown(true)
                  }
                  placeholder="Hledejte podle n\u00e1zvu, I\u010CO, emailu..."
                  className="pl-9"
                />
                {searchingContacts && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                )}
              </div>
              {showContactDropdown && contactResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-auto">
                  {contactResults.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                      onClick={() => selectContact(contact)}
                    >
                      <span className="font-medium">
                        {contact.companyName ||
                          [contact.firstName, contact.lastName]
                            .filter(Boolean)
                            .join(" ")}
                      </span>
                      {contact.email && (
                        <span className="text-gray-400 ml-2">
                          {contact.email}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {selectedContact && (
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-green-600">
                    Vybr\u00e1no:{" "}
                    {selectedContact.companyName ||
                      [selectedContact.firstName, selectedContact.lastName]
                        .filter(Boolean)
                        .join(" ")}
                  </span>
                  <button
                    type="button"
                    className="text-xs text-red-500 hover:underline"
                    onClick={() => {
                      setSelectedContact(null);
                      setContactQuery("");
                    }}
                  >
                    Odebrat
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Datum zah\u00e1jen\u00ed
                </label>
                <Input name="startDate" type="date" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Datum ukon\u010Den\u00ed
                </label>
                <Input name="endDate" type="date" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rozpo\u010Det (K\u010D)
              </label>
              <Input
                name="budget"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresa stavby
              </label>
              <Input name="address" placeholder="Ulice, m\u011bsto" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zem\u011bpisn\u00e1 \u0161\u00ed\u0159ka (lat)
                </label>
                <Input
                  name="lat"
                  type="number"
                  step="any"
                  placeholder="49.1951"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zem\u011bpisn\u00e1 d\u00e9lka (lng)
                </label>
                <Input
                  name="lng"
                  type="number"
                  step="any"
                  placeholder="16.6068"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Vytvo\u0159it zak\u00e1zku
              </Button>
              <Link href="/zakazky">
                <Button type="button" variant="outline">
                  Zru\u0161it
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
