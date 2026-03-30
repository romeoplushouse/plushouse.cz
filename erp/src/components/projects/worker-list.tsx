"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, Users, Trash2 } from "lucide-react";
import { addProjectWorker, removeProjectWorker } from "@/lib/actions/projects";

type WorkerItem = {
  id: string;
  role: string | null;
  employee: { id: string; firstName: string; lastName: string; position: string | null } | null;
  subcontractor: {
    id: string;
    specialization: string | null;
    contact: { companyName: string | null; firstName: string | null; lastName: string | null } | null;
  } | null;
};

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
};

export function WorkerList({
  projectId,
  workers,
  employees,
}: {
  projectId: string;
  workers: WorkerItem[];
  employees: Employee[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleAdd(formData: FormData) {
    const employeeId = formData.get("employeeId") as string;
    const role = formData.get("role") as string;
    if (!employeeId) return;

    startTransition(async () => {
      await addProjectWorker(projectId, {
        employeeId: employeeId || undefined,
        role: role || undefined,
      });
      setShowForm(false);
      router.refresh();
    });
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    startTransition(async () => {
      await removeProjectWorker(id);
      setRemovingId(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          Pracovn\u00edci ({workers.length})
        </h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" />
          P\u0159idat pracovn\u00edka
        </Button>
      </div>

      {showForm && (
        <form
          action={handleAdd}
          className="p-4 border border-gray-200 rounded-lg space-y-3 bg-gray-50"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Zam\u011bstnanec *
              </label>
              <select
                name="employeeId"
                required
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Vyberte --</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Role</label>
              <Input name="role" placeholder="Nap\u0159. vedouc\u00ed, tesa\u0159..." />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              P\u0159idat
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Zru\u0161it
            </Button>
          </div>
        </form>
      )}

      {workers.length === 0 ? (
        <div className="text-center py-6">
          <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            Zat\u00edm \u017e\u00e1dn\u00ed p\u0159i\u0159azen\u00ed pracovn\u00edci.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {workers.map((w) => {
            const name = w.employee
              ? `${w.employee.firstName} ${w.employee.lastName}`
              : w.subcontractor?.contact
                ? w.subcontractor.contact.companyName ||
                  [w.subcontractor.contact.firstName, w.subcontractor.contact.lastName]
                    .filter(Boolean)
                    .join(" ")
                : "Nezn\u00e1m\u00fd";

            return (
              <div
                key={w.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {w.role && <span>{w.role}</span>}
                    {w.employee?.position && <span>{w.employee.position}</span>}
                    {w.subcontractor?.specialization && (
                      <span>{w.subcontractor.specialization}</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={removingId === w.id}
                  onClick={() => handleRemove(w.id)}
                >
                  {removingId === w.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-red-400" />
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
