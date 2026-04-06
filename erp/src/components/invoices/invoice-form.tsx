"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createInvoice } from "@/lib/actions/invoices";
import { searchContacts } from "@/lib/actions/contacts";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, Search, Loader2 } from "lucide-react";

const INVOICE_TYPES = [
  { value: "ISSUED", label: "Vydana" },
  { value: "RECEIVED", label: "Prijata" },
  { value: "ADVANCE", label: "Zalohova" },
  { value: "PROFORMA", label: "Proforma" },
  { value: "CREDIT_NOTE", label: "Dobropis" },
] as const;

const UNITS = [
  { value: "ks", label: "ks" },
  { value: "hod", label: "hod" },
  { value: "m", label: "m" },
  { value: "m2", label: "m2" },
] as const;

const VAT_RATES = [
  { value: 21, label: "21 %" },
  { value: 12, label: "12 %" },
  { value: 0, label: "0 %" },
] as const;

const PAYMENT_METHODS = [
  { value: "BANK_TRANSFER", label: "Bankovni prevod" },
  { value: "CASH", label: "Hotovost" },
  { value: "CARD", label: "Kartou" },
] as const;

interface LineItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
}

interface InvoiceFormData {
  type: "ISSUED" | "RECEIVED" | "ADVANCE" | "PROFORMA" | "CREDIT_NOTE";
  customerId: string;
  supplierId: string;
  issueDate: string;
  dueDate: string;
  taxDate: string;
  variableSymbol: string;
  constantSymbol: string;
  bankAccount: string;
  paymentMethod: string;
  notes: string;
  items: LineItem[];
}

interface Contact {
  id: string;
  companyName: string | null;
  firstName: string | null;
  lastName: string | null;
  ico: string | null;
  email: string | null;
}

function getContactDisplayName(c: Contact): string {
  if (c.companyName) return c.companyName;
  return [c.firstName, c.lastName].filter(Boolean).join(" ") || "Bez nazvu";
}

function calculateLineTotal(item: LineItem) {
  const subtotal = item.quantity * item.unitPrice;
  const vat = subtotal * (item.vatRate / 100);
  return { subtotal, vat, total: subtotal + vat };
}

export default function InvoiceForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [contactQuery, setContactQuery] = useState("");
  const [contactResults, setContactResults] = useState<Contact[]>([]);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchingContacts, setSearchingContacts] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const dueDefault = new Date(Date.now() + 14 * 86400000)
    .toISOString()
    .split("T")[0];

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    defaultValues: {
      type: "ISSUED",
      customerId: "",
      supplierId: "",
      issueDate: today,
      dueDate: dueDefault,
      taxDate: today,
      variableSymbol: "",
      constantSymbol: "",
      bankAccount: "",
      paymentMethod: "BANK_TRANSFER",
      notes: "",
      items: [
        { description: "", quantity: 1, unit: "ks", unitPrice: 0, vatRate: 21 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");
  const watchedType = watch("type");

  // Calculate totals
  const totals = watchedItems.reduce(
    (acc, item) => {
      const calc = calculateLineTotal(item);
      return {
        subtotal: acc.subtotal + calc.subtotal,
        vat: acc.vat + calc.vat,
        total: acc.total + calc.total,
      };
    },
    { subtotal: 0, vat: 0, total: 0 }
  );

  // Contact search with debounce
  const doSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setContactResults([]);
      setShowContactDropdown(false);
      return;
    }
    setSearchingContacts(true);
    try {
      const results = await searchContacts(query);
      setContactResults(results as Contact[]);
      setShowContactDropdown(true);
    } catch {
      setContactResults([]);
    } finally {
      setSearchingContacts(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(contactQuery), 300);
    return () => clearTimeout(timer);
  }, [contactQuery, doSearch]);

  function selectContact(contact: Contact) {
    setSelectedContact(contact);
    setContactQuery(getContactDisplayName(contact));
    setShowContactDropdown(false);

    const isReceived = watchedType === "RECEIVED";
    if (isReceived) {
      setValue("supplierId", contact.id);
    } else {
      setValue("customerId", contact.id);
    }
  }

  async function onSubmit(data: InvoiceFormData) {
    setServerError(null);

    // Map PROFORMA to the server action's expected type
    const typeMap: Record<string, string> = {
      ISSUED: "ISSUED",
      RECEIVED: "RECEIVED",
      ADVANCE: "ADVANCE",
      PROFORMA: "PROFORMA",
      CREDIT_NOTE: "CREDIT_NOTE",
    };

    startTransition(async () => {
      try {
        await createInvoice({
          type: typeMap[data.type] as Parameters<typeof createInvoice>[0]["type"],
          customerId: data.customerId || undefined,
          supplierId: data.supplierId || undefined,
          issueDate: data.issueDate,
          dueDate: data.dueDate,
          taxDate: data.taxDate || undefined,
          variableSymbol: data.variableSymbol || undefined,
          bankAccount: data.bankAccount || undefined,
          paymentMethod: data.paymentMethod || undefined,
          notes: data.notes || undefined,
          items: data.items.map((item) => ({
            description: item.description,
            quantity: Number(item.quantity),
            unit: item.unit,
            unitPrice: Number(item.unitPrice),
            vatRate: Number(item.vatRate),
          })),
        });
        router.push("/faktury");
      } catch (err) {
        setServerError(
          err instanceof Error ? err.message : "Chyba pri vytvareni faktury"
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {/* Type selector */}
      <Card>
        <CardHeader>
          <CardTitle>Typ faktury</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {INVOICE_TYPES.map((t) => (
              <label key={t.value} className="cursor-pointer">
                <input
                  type="radio"
                  value={t.value}
                  {...register("type")}
                  className="sr-only peer"
                />
                <span className="inline-flex items-center px-4 py-2 rounded-md border text-sm font-medium peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 hover:bg-gray-50 transition-colors">
                  {t.label}
                </span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact selection */}
      <Card>
        <CardHeader>
          <CardTitle>
            {watchedType === "RECEIVED" ? "Dodavatel" : "Odberatel"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Hledat kontakt (nazev, ICO, email)..."
                value={contactQuery}
                onChange={(e) => {
                  setContactQuery(e.target.value);
                  setSelectedContact(null);
                  setValue("customerId", "");
                  setValue("supplierId", "");
                }}
                className="pl-10"
              />
              {searchingContacts && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
              )}
            </div>
            {showContactDropdown && contactResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                {contactResults.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                    onClick={() => selectContact(c)}
                  >
                    <div className="font-medium">
                      {getContactDisplayName(c)}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {[c.ico && `ICO: ${c.ico}`, c.email]
                        .filter(Boolean)
                        .join(" | ")}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showContactDropdown && contactResults.length === 0 && contactQuery.length >= 2 && !searchingContacts && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4 text-sm text-gray-500">
                Zadny kontakt nenalezen
              </div>
            )}
          </div>
          {selectedContact && (
            <div className="mt-2 text-sm text-green-700 bg-green-50 rounded-md px-3 py-2">
              Vybrano: {getContactDisplayName(selectedContact)}
              {selectedContact.ico && ` (ICO: ${selectedContact.ico})`}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dates and identifiers */}
      <Card>
        <CardHeader>
          <CardTitle>Udaje faktury</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Datum vystaveni *
              </label>
              <Input
                type="date"
                {...register("issueDate", {
                  required: "Datum vystaveni je povinny",
                })}
              />
              {errors.issueDate && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.issueDate.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Datum splatnosti *
              </label>
              <Input
                type="date"
                {...register("dueDate", {
                  required: "Datum splatnosti je povinny",
                })}
              />
              {errors.dueDate && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.dueDate.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Datum zdanitelneho plneni (DUZP)
              </label>
              <Input type="date" {...register("taxDate")} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Variabilni symbol
              </label>
              <Input
                placeholder="Automaticky dle cisla faktury"
                {...register("variableSymbol")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Konstantni symbol
              </label>
              <Input placeholder="0308" {...register("constantSymbol")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zpusob uhrady
              </label>
              <select
                {...register("paymentMethod")}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bankovni ucet
            </label>
            <Input
              placeholder="CZ65 0800 0000 1920 0014 5399"
              {...register("bankAccount")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Line items */}
      <Card>
        <CardHeader>
          <CardTitle>Polozky faktury</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase px-1">
              <div className="col-span-4">Popis</div>
              <div className="col-span-1">Mnozstvi</div>
              <div className="col-span-1">Jednotka</div>
              <div className="col-span-2">Cena za j.</div>
              <div className="col-span-1">DPH</div>
              <div className="col-span-2 text-right">Celkem</div>
              <div className="col-span-1"></div>
            </div>

            {fields.map((field, index) => {
              const item = watchedItems[index];
              const lineCalc = item
                ? calculateLineTotal(item)
                : { subtotal: 0, vat: 0, total: 0 };

              return (
                <div
                  key={field.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start p-3 rounded-md border border-gray-100 bg-gray-50/50"
                >
                  <div className="md:col-span-4">
                    <label className="md:hidden block text-xs font-medium text-gray-500 mb-1">
                      Popis
                    </label>
                    <Input
                      placeholder="Popis polozky"
                      {...register(`items.${index}.description`, {
                        required: "Popis je povinny",
                      })}
                    />
                    {errors.items?.[index]?.description && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors.items[index].description?.message}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-1">
                    <label className="md:hidden block text-xs font-medium text-gray-500 mb-1">
                      Mnozstvi
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`items.${index}.quantity`, {
                        valueAsNumber: true,
                        required: true,
                        min: 0.01,
                      })}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="md:hidden block text-xs font-medium text-gray-500 mb-1">
                      Jednotka
                    </label>
                    <select
                      {...register(`items.${index}.unit`)}
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {UNITS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="md:hidden block text-xs font-medium text-gray-500 mb-1">
                      Cena za jednotku
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`items.${index}.unitPrice`, {
                        valueAsNumber: true,
                        required: true,
                        min: 0,
                      })}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="md:hidden block text-xs font-medium text-gray-500 mb-1">
                      DPH
                    </label>
                    <select
                      {...register(`items.${index}.vatRate`, {
                        valueAsNumber: true,
                      })}
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {VAT_RATES.map((v) => (
                        <option key={v.value} value={v.value}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2 flex items-center justify-end">
                    <label className="md:hidden block text-xs font-medium text-gray-500 mb-1 mr-auto">
                      Celkem
                    </label>
                    <span className="text-sm font-medium h-10 flex items-center">
                      {formatCurrency(lineCalc.total)}
                    </span>
                  </div>
                  <div className="md:col-span-1 flex items-center justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => fields.length > 1 && remove(index)}
                      disabled={fields.length <= 1}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  description: "",
                  quantity: 1,
                  unit: "ks",
                  unitPrice: 0,
                  vatRate: 21,
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Pridat polozku
            </Button>
          </div>

          {/* Totals */}
          <div className="mt-6 border-t pt-4">
            <div className="flex flex-col items-end space-y-1">
              <div className="flex justify-between w-64 text-sm">
                <span className="text-gray-500">Zaklad bez DPH:</span>
                <span className="font-medium">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>
              <div className="flex justify-between w-64 text-sm">
                <span className="text-gray-500">DPH celkem:</span>
                <span className="font-medium">
                  {formatCurrency(totals.vat)}
                </span>
              </div>
              <div className="flex justify-between w-64 text-lg border-t pt-2 mt-1">
                <span className="font-semibold">Celkem k uhrade:</span>
                <span className="font-bold text-blue-600">
                  {formatCurrency(totals.total)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Poznamky</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            {...register("notes")}
            rows={3}
            placeholder="Doplnujici informace k fakture..."
            className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/faktury")}
        >
          Zrusit
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Vytvorit fakturu
        </Button>
      </div>
    </form>
  );
}
