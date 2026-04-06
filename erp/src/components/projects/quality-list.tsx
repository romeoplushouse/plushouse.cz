"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, ClipboardCheck, Star } from "lucide-react";
import { addQualityCheck } from "@/lib/actions/projects";

type QualityCheckType = {
  id: string;
  checkDate: Date | string;
  status: string;
  score: number | null;
  notes: string | null;
  items: { id: string; criteria: string; passed: boolean; notes: string | null }[];
};

const statusLabels: Record<string, string> = {
  PENDING: "Čeká na kontrolu",
  PASSED: "Schváleno",
  FAILED: "Neschváleno",
  NEEDS_REWORK: "Vyžaduje přepracování",
};

const statusVariants: Record<string, "default" | "success" | "destructive" | "warning"> = {
  PENDING: "default",
  PASSED: "success",
  FAILED: "destructive",
  NEEDS_REWORK: "warning",
};

export function QualityList({
  projectId,
  checks,
}: {
  projectId: string;
  checks: QualityCheckType[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);

  async function handleAdd(formData: FormData) {
    const criteria = formData.get("criteria") as string;
    if (!criteria?.trim()) return;

    const score = parseFloat(formData.get("score") as string);
    const notes = formData.get("notes") as string;
    const passed = (formData.get("passed") as string) === "true";

    startTransition(async () => {
      await addQualityCheck(projectId, {
        score: isNaN(score) ? undefined : score,
        notes: notes || undefined,
        items: [
          {
            criteria: criteria.trim(),
            passed,
            notes: (formData.get("itemNotes") as string) || undefined,
            severity: (formData.get("severity") as string) || undefined,
          },
        ],
      });
      setShowForm(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          Kontroly kvality ({checks.length})
        </h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" />
          Nová kontrola
        </Button>
      </div>

      {showForm && (
        <form
          action={handleAdd}
          className="p-4 border border-gray-200 rounded-lg space-y-3 bg-gray-50"
        >
          <Input name="criteria" placeholder="Kritérium kontroly *" required />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Skóre (1-5)
              </label>
              <Input name="score" type="number" min="1" max="5" step="0.5" placeholder="5" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Výsledek
              </label>
              <select
                name="passed"
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">Vyhovuje</option>
                <option value="false">Nevyhovuje</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Závažnost
              </label>
              <select
                name="severity"
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">--</option>
                <option value="LOW">Nízká</option>
                <option value="MEDIUM">Střední</option>
                <option value="HIGH">Vysoká</option>
                <option value="CRITICAL">Kritická</option>
              </select>
            </div>
          </div>
          <textarea
            name="notes"
            rows={2}
            className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Poznámky ke kontrole..."
          />
          <textarea
            name="itemNotes"
            rows={2}
            className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Poznámky ke kritériu..."
          />
          <p className="text-xs text-gray-400">
            Fotografie bude možné přidat v záložce Fotodokumentace.
          </p>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
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

      {checks.length === 0 ? (
        <div className="text-center py-6">
          <ClipboardCheck className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            Zatím žádné kontroly kvality.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {checks.map((check) => (
            <div
              key={check.id}
              className="p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariants[check.status] ?? "default"}>
                    {statusLabels[check.status] ?? check.status}
                  </Badge>
                  {check.score && (
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      {check.score}/5
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(check.checkDate).toLocaleDateString("cs-CZ")}
                </span>
              </div>
              {check.notes && (
                <p className="text-sm text-gray-600 mb-2">{check.notes}</p>
              )}
              {check.items.length > 0 && (
                <div className="space-y-1">
                  {check.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span
                        className={
                          item.passed ? "text-green-600" : "text-red-600"
                        }
                      >
                        {item.passed ? "✓" : "✗"}
                      </span>
                      <span>{item.criteria}</span>
                      {item.notes && (
                        <span className="text-gray-400">- {item.notes}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
