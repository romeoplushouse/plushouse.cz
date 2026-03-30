"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Trash2, Star } from "lucide-react";
import {
  getSubcontractorById,
  addPriceListItem,
  removePriceListItem,
  generateFrameworkAgreement,
} from "@/lib/actions/subcontractors";

type SubcontractorData = Awaited<ReturnType<typeof getSubcontractorById>>;

export default function SubcontractorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [sub, setSub] = useState<SubcontractorData>(null);
  const [loading, setLoading] = useState(true);
  const [agreement, setAgreement] = useState<string | null>(null);
  const [showPriceForm, setShowPriceForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const data = await getSubcontractorById(params.id as string);
    setSub(data);
    setLoading(false);
  }

  async function handleAddPriceItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await addPriceListItem(params.id as string, {
      description: form.get("description") as string,
      unit: form.get("unit") as string,
      unitPrice: Number(form.get("unitPrice")),
      category: (form.get("category") as string) || undefined,
    });
    setShowPriceForm(false);
    loadData();
  }

  async function handleRemovePrice(id: string) {
    if (!confirm("Opravdu chcete odstranit tuto položku?")) return;
    await removePriceListItem(id);
    loadData();
  }

  async function handleGenerateAgreement() {
    const text = await generateFrameworkAgreement(params.id as string);
    setAgreement(text);
    loadData();
  }

  if (loading || !sub) {
    return <div className="text-center py-12 text-gray-500">Načítám...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {sub.contact.companyName}
          </h1>
          <p className="text-gray-500">
            {sub.specialization} {sub.trade ? `• ${sub.trade}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateAgreement}>
            <FileText className="h-4 w-4 mr-2" />
            Generovat rámcovou smlouvu
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <Card>
          <CardHeader><CardTitle>Kontaktní údaje</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {sub.contact.ico && <p><span className="text-gray-500">IČO:</span> {sub.contact.ico}</p>}
            {sub.contact.dic && <p><span className="text-gray-500">DIČ:</span> {sub.contact.dic}</p>}
            {sub.contact.email && <p><span className="text-gray-500">Email:</span> {sub.contact.email}</p>}
            {sub.contact.phone && <p><span className="text-gray-500">Tel:</span> {sub.contact.phone}</p>}
            {sub.contact.street && (
              <p><span className="text-gray-500">Adresa:</span> {sub.contact.street}, {sub.contact.city} {sub.contact.zip}</p>
            )}
            {sub.contact.bankAccount && (
              <p><span className="text-gray-500">Účet:</span> {sub.contact.bankAccount}</p>
            )}
          </CardContent>
        </Card>

        {/* Work Details */}
        <Card>
          <CardHeader><CardTitle>Pracovní údaje</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-gray-500">Hodinová sazba:</span> {sub.hourlyRate ? `${Number(sub.hourlyRate).toLocaleString("cs-CZ")} Kč/hod` : "—"}</p>
            <p><span className="text-gray-500">Denní sazba:</span> {sub.dailyRate ? `${Number(sub.dailyRate).toLocaleString("cs-CZ")} Kč/den` : "—"}</p>
            <p><span className="text-gray-500">Hodnocení:</span> {sub.rating ? `${sub.rating.toFixed(1)} / 5` : "—"}</p>
            <p>
              <span className="text-gray-500">Rámcová smlouva:</span>{" "}
              {sub.hasFrameworkAgreement ? (
                <Badge variant="success">Platná</Badge>
              ) : (
                <Badge variant="secondary">Bez smlouvy</Badge>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader><CardTitle>Zakázky ({sub.projectWorkers.length})</CardTitle></CardHeader>
          <CardContent>
            {sub.projectWorkers.length === 0 ? (
              <p className="text-sm text-gray-500">Žádné přiřazené zakázky</p>
            ) : (
              <ul className="space-y-2">
                {sub.projectWorkers.map((pw) => (
                  <li key={pw.id} className="text-sm">
                    <span className="font-medium">{pw.project.name}</span>
                    {pw.role && <span className="text-gray-500 ml-1">({pw.role})</span>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Price List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ceník</CardTitle>
          <Button size="sm" onClick={() => setShowPriceForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Přidat položku
          </Button>
        </CardHeader>
        <CardContent>
          {showPriceForm && (
            <form onSubmit={handleAddPriceItem} className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-2">
                  <Input name="description" placeholder="Popis práce" required />
                </div>
                <div>
                  <Input name="unit" placeholder="Jednotka" defaultValue="hod" required />
                </div>
                <div>
                  <Input name="unitPrice" type="number" placeholder="Cena" required />
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <Input name="category" placeholder="Kategorie (volitelné)" className="max-w-xs" />
                <Button type="submit" size="sm">Uložit</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowPriceForm(false)}>Zrušit</Button>
              </div>
            </form>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Popis</TableHead>
                <TableHead>Jednotka</TableHead>
                <TableHead>Kategorie</TableHead>
                <TableHead className="text-right">Cena</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sub.priceListItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-4">
                    Zatím žádné položky v ceníku
                  </TableCell>
                </TableRow>
              ) : (
                sub.priceListItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{item.category ?? "—"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {Number(item.unitPrice).toLocaleString("cs-CZ")} Kč
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleRemovePrice(item.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Generated Agreement */}
      {agreement && (
        <Card>
          <CardHeader><CardTitle>Vygenerovaná rámcová smlouva</CardTitle></CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg font-mono leading-relaxed">
              {agreement}
            </pre>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => navigator.clipboard.writeText(agreement)}>
                Kopírovat do schránky
              </Button>
              <Button variant="outline" onClick={() => setAgreement(null)}>
                Zavřít
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
