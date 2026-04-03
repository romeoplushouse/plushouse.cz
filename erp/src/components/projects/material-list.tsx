"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Loader2, Package } from "lucide-react";
import { addProjectMaterial } from "@/lib/actions/projects";
import { formatCurrency } from "@/lib/utils";

type MaterialItem = {
  id: string;
  name: string;
  quantity: number | { toNumber?: () => number };
  unit: string;
  unitCost: number | { toNumber?: () => number };
  totalCost: number | { toNumber?: () => number };
  invoiceRef: string | null;
  date: Date | string;
};

function toNumber(val: number | { toNumber?: () => number }): number {
  if (typeof val === "number") return val;
  if (val && typeof val.toNumber === "function") return val.toNumber();
  return Number(val);
}

export function MaterialList({
  projectId,
  materials,
}: {
  projectId: string;
  materials: MaterialItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);

  const totalSum = materials.reduce((sum, m) => sum + toNumber(m.totalCost), 0);

  async function handleAdd(formData: FormData) {
    const name = formData.get("name") as string;
    const quantity = parseFloat(formData.get("quantity") as string);
    const unitCost = parseFloat(formData.get("unitCost") as string);
    if (!name?.trim() || isNaN(quantity) || isNaN(unitCost)) return;

    startTransition(async () => {
      await addProjectMaterial(projectId, {
        name: name.trim(),
        quantity,
        unit: (formData.get("unit") as string) || "ks",
        unitCost,
        invoiceRef: (formData.get("invoiceRef") as string) || undefined,
      });
      setShowForm(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          Materiál ({materials.length})
        </h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" />
          Přidat materiál
        </Button>
      </div>

      {showForm && (
        <form
          action={handleAdd}
          className="p-4 border border-gray-200 rounded-lg space-y-3 bg-gray-50"
        >
          <Input name="name" placeholder="Název materiálu *" required />
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Množství *
              </label>
              <Input
                name="quantity"
                type="number"
                step="any"
                min="0"
                placeholder="1"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Jednotka
              </label>
              <select
                name="unit"
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ks">ks</option>
                <option value="m">m</option>
                <option value="m2">m²</option>
                <option value="m3">m³</option>
                <option value="kg">kg</option>
                <option value="l">l</option>
                <option value="bal">bal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Cena za jednotku (Kč) *
              </label>
              <Input
                name="unitCost"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Ref. faktury
              </label>
              <Input name="invoiceRef" placeholder="FP-..." />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending && (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              )}
              Uložit
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Zrušit
            </Button>
          </div>
        </form>
      )}

      {materials.length === 0 ? (
        <div className="text-center py-6">
          <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            Zatím žádný materiál.
          </p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Název</TableHead>
                <TableHead className="text-right">Množství</TableHead>
                <TableHead>Jednotka</TableHead>
                <TableHead className="text-right">
                  Cena/ks
                </TableHead>
                <TableHead className="text-right">Celkem</TableHead>
                <TableHead>Datum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-right">
                    {toNumber(m.quantity)}
                  </TableCell>
                  <TableCell>{m.unit}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(toNumber(m.unitCost))}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(toNumber(m.totalCost))}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {new Date(m.date).toLocaleDateString("cs-CZ")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="text-right pr-4 font-semibold">
            Celkem: {formatCurrency(totalSum)}
          </div>
        </>
      )}
    </div>
  );
}
