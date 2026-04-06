"use client";

import { useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AccountSelector } from "@/components/accounting/account-selector";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createJournalEntry } from "@/lib/actions/accounting";
import { formatCurrency } from "@/lib/utils";

type Account = {
  code: string;
  name: string;
  type: string;
  group: string | null;
};

type JournalLine = {
  accountCode: string;
  debit: string;
  credit: string;
  description: string;
};

type FormValues = {
  date: string;
  description: string;
  documentRef: string;
  documentType: string;
  items: JournalLine[];
};

const documentTypes = [
  { value: "", label: "-- Vyberte typ --" },
  { value: "INVOICE", label: "Faktura" },
  { value: "RECEIPT", label: "Prijmovy doklad" },
  { value: "BANK_STATEMENT", label: "Bankovni vypis" },
  { value: "CASH_RECEIPT", label: "Pokladni doklad" },
  { value: "INTERNAL", label: "Interni doklad" },
  { value: "OTHER", label: "Ostatni" },
];

export function JournalEntryForm({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      date: today,
      description: "",
      documentRef: "",
      documentType: "",
      items: [
        { accountCode: "", debit: "", credit: "", description: "" },
        { accountCode: "", debit: "", credit: "", description: "" },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");

  const totalDebit = watchedItems.reduce(
    (sum, item) => sum + (parseFloat(item.debit) || 0),
    0
  );
  const totalCredit = watchedItems.reduce(
    (sum, item) => sum + (parseFloat(item.credit) || 0),
    0
  );
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
  const hasAmounts = totalDebit > 0 || totalCredit > 0;

  async function onSubmit(data: FormValues) {
    setServerError(null);

    if (!isBalanced) return;

    const items = data.items
      .filter(
        (item) =>
          item.accountCode &&
          (parseFloat(item.debit) > 0 || parseFloat(item.credit) > 0)
      )
      .map((item) => ({
        accountCode: item.accountCode,
        debit: parseFloat(item.debit) || 0,
        credit: parseFloat(item.credit) || 0,
        description: item.description || undefined,
      }));

    if (items.length < 2) {
      setServerError("Ucetni zapis musi mit alespon 2 radky.");
      return;
    }

    startTransition(async () => {
      try {
        await createJournalEntry({
          date: data.date,
          description: data.description,
          documentRef: data.documentRef || undefined,
          documentType: data.documentType || undefined,
          items,
        });
        router.push("/ucetnictvi/denik");
      } catch (err) {
        setServerError(
          err instanceof Error ? err.message : "Nastala neocekavana chyba."
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header section */}
      <Card>
        <CardHeader>
          <CardTitle>Zakladni udaje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Datum *
              </label>
              <Input
                type="date"
                {...register("date", { required: "Datum je povinne" })}
              />
              {errors.date && (
                <p className="text-sm text-red-400 mt-1">
                  {errors.date.message}
                </p>
              )}
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Popis *
              </label>
              <Input
                placeholder="Popis ucetniho zapisu..."
                {...register("description", { required: "Popis je povinny" })}
              />
              {errors.description && (
                <p className="text-sm text-red-400 mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Typ dokladu
              </label>
              <select
                {...register("documentType")}
                className="flex h-10 w-full rounded-md border border-[#2a2d35] bg-[#1a1d24] text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B5E126] focus:border-transparent"
              >
                {documentTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Cislo dokladu
              </label>
              <Input
                placeholder="Napr. FV-2026-0001"
                {...register("documentRef")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journal lines */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ucetni radky</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                accountCode: "",
                debit: "",
                credit: "",
                description: "",
              })
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            Pridat radek
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Header */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
              <div className="col-span-4">Ucet</div>
              <div className="col-span-2 text-right">MD (Kc)</div>
              <div className="col-span-2 text-right">D (Kc)</div>
              <div className="col-span-3">Popis radku</div>
              <div className="col-span-1"></div>
            </div>

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start p-2 rounded-lg bg-[#1a1d24]"
              >
                <div className="sm:col-span-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1 sm:hidden">
                    Ucet
                  </label>
                  <AccountSelector
                    accounts={accounts}
                    value={watchedItems[index]?.accountCode || ""}
                    onChange={(val) =>
                      setValue(`items.${index}.accountCode`, val)
                    }
                    placeholder="Vyberte ucet..."
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1 sm:hidden">
                    MD (Kc)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    className="text-right"
                    {...register(`items.${index}.debit`)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1 sm:hidden">
                    D (Kc)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    className="text-right"
                    {...register(`items.${index}.credit`)}
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1 sm:hidden">
                    Popis
                  </label>
                  <Input
                    placeholder="Popis..."
                    {...register(`items.${index}.description`)}
                  />
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  {fields.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Totals */}
            <div className="border-t pt-3 mt-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center px-2">
                <div className="sm:col-span-4 font-medium text-gray-400">
                  Celkem
                </div>
                <div className="sm:col-span-2 text-right font-mono font-bold">
                  {formatCurrency(totalDebit)}
                </div>
                <div className="sm:col-span-2 text-right font-mono font-bold">
                  {formatCurrency(totalCredit)}
                </div>
                <div className="sm:col-span-4">
                  {hasAmounts && (
                    <>
                      {isBalanced ? (
                        <Badge variant="success">Vyrovnano</Badge>
                      ) : (
                        <Badge variant="destructive">
                          Rozdil: {formatCurrency(Math.abs(totalDebit - totalCredit))}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Balance error */}
            {hasAmounts && !isBalanced && (
              <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 mt-2">
                <p className="text-sm text-red-400 font-medium">
                  Strana MD ({formatCurrency(totalDebit)}) se nerovna strane D (
                  {formatCurrency(totalCredit)}). Ucetni zapis musi byt
                  vyrovnany -- celkova castka na strane MD se musi rovnat
                  celkove castce na strane D.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Server error */}
      {serverError && (
        <div className="rounded-md bg-red-500/10 border border-red-500/20 p-4">
          <p className="text-sm text-red-400">{serverError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link href="/ucetnictvi/denik">
          <Button type="button" variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zpet na denik
          </Button>
        </Link>
        <Button
          type="submit"
          disabled={isPending || (hasAmounts && !isBalanced)}
        >
          <Save className="h-4 w-4 mr-2" />
          {isPending ? "Ukladam..." : "Ulozit zapis"}
        </Button>
      </div>
    </form>
  );
}
