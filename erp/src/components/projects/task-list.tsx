"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, CheckCircle, Circle, Clock, Eye } from "lucide-react";
import { addProjectTask, updateTaskStatus } from "@/lib/actions/projects";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: number;
  dueDate: Date | string | null;
  assignee: { firstName: string; lastName: string } | null;
};

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
};

const statusLabels: Record<string, string> = {
  TODO: "K udělání",
  IN_PROGRESS: "Probíhá",
  REVIEW: "Ke kontrole",
  DONE: "Hotovo",
  CANCELLED: "Zrušeno",
};

const statusVariants: Record<
  string,
  "default" | "secondary" | "success" | "warning" | "destructive"
> = {
  TODO: "secondary",
  IN_PROGRESS: "warning",
  REVIEW: "default",
  DONE: "success",
  CANCELLED: "destructive",
};

const priorityLabels: Record<number, string> = {
  0: "Normální",
  1: "Vysoká",
  2: "Kritická",
};

export function TaskList({
  projectId,
  tasks,
  employees,
}: {
  projectId: string;
  tasks: Task[];
  employees: Employee[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  async function handleAddTask(formData: FormData) {
    const title = formData.get("title") as string;
    if (!title?.trim()) return;

    startTransition(async () => {
      await addProjectTask(projectId, {
        title: title.trim(),
        description: (formData.get("description") as string) || undefined,
        assigneeId: (formData.get("assigneeId") as string) || undefined,
        dueDate: (formData.get("dueDate") as string) || undefined,
        priority: parseInt((formData.get("priority") as string) || "0"),
      });
      setShowForm(false);
      router.refresh();
    });
  }

  async function handleStatusChange(
    taskId: string,
    newStatus: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "CANCELLED"
  ) {
    setUpdatingTaskId(taskId);
    startTransition(async () => {
      await updateTaskStatus(taskId, newStatus);
      setUpdatingTaskId(null);
      router.refresh();
    });
  }

  const nextStatus: Record<string, "IN_PROGRESS" | "REVIEW" | "DONE"> = {
    TODO: "IN_PROGRESS",
    IN_PROGRESS: "REVIEW",
    REVIEW: "DONE",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          Úkoly ({tasks.length})
        </h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" />
          Přidat úkol
        </Button>
      </div>

      {showForm && (
        <form
          action={handleAddTask}
          className="p-4 border border-gray-200 rounded-lg space-y-3 bg-gray-50"
        >
          <Input name="title" placeholder="Název úkolu *" required />
          <textarea
            name="description"
            rows={2}
            className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Popis..."
          />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Přiřadit
              </label>
              <select
                name="assigneeId"
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Nepřiřazeno --</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Termín
              </label>
              <Input name="dueDate" type="date" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Priorita
              </label>
              <select
                name="priority"
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="0">Normální</option>
                <option value="1">Vysoká</option>
                <option value="2">Kritická</option>
              </select>
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

      {tasks.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">
          Zatím žádné úkoly. Přidejte první úkol.
        </p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* Quick status toggle */}
              <button
                type="button"
                disabled={
                  updatingTaskId === task.id ||
                  task.status === "DONE" ||
                  task.status === "CANCELLED"
                }
                onClick={() => {
                  const next = nextStatus[task.status];
                  if (next) handleStatusChange(task.id, next);
                }}
                className="flex-shrink-0 disabled:opacity-50"
                title={
                  task.status === "DONE"
                    ? "Hotovo"
                    : `Přepnout na: ${statusLabels[nextStatus[task.status]] ?? ""}`
                }
              >
                {updatingTaskId === task.id ? (
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                ) : task.status === "DONE" ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : task.status === "IN_PROGRESS" ? (
                  <Clock className="h-5 w-5 text-yellow-500" />
                ) : task.status === "REVIEW" ? (
                  <Eye className="h-5 w-5 text-blue-500" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    task.status === "DONE"
                      ? "line-through text-gray-400"
                      : "text-gray-900"
                  }`}
                >
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-xs text-gray-500 truncate">
                    {task.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {task.priority > 0 && (
                  <Badge variant={task.priority >= 2 ? "destructive" : "warning"}>
                    {priorityLabels[task.priority]}
                  </Badge>
                )}
                <Badge variant={statusVariants[task.status] ?? "secondary"}>
                  {statusLabels[task.status] ?? task.status}
                </Badge>
                {task.assignee && (
                  <span className="text-xs text-gray-500">
                    {task.assignee.firstName} {task.assignee.lastName}
                  </span>
                )}
                {task.dueDate && (
                  <span className="text-xs text-gray-400">
                    {new Date(task.dueDate).toLocaleDateString("cs-CZ")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
