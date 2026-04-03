"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { updateProjectStatus } from "@/lib/actions/projects";

type Status = "NEW" | "QUOTED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";

const transitions: Record<string, { label: string; target: Status; variant: "default" | "outline" | "destructive" | "secondary" }[]> = {
  NEW: [
    { label: "Zahájit realizaci", target: "IN_PROGRESS", variant: "default" },
    { label: "Nacenit", target: "QUOTED", variant: "outline" },
    { label: "Zrušit", target: "CANCELLED", variant: "destructive" },
  ],
  QUOTED: [
    { label: "Zahájit realizaci", target: "IN_PROGRESS", variant: "default" },
    { label: "Zpět na Novou", target: "NEW", variant: "outline" },
    { label: "Zrušit", target: "CANCELLED", variant: "destructive" },
  ],
  IN_PROGRESS: [
    { label: "Dokončit", target: "COMPLETED", variant: "default" },
    { label: "Pozastavit", target: "ON_HOLD", variant: "secondary" },
    { label: "Zrušit", target: "CANCELLED", variant: "destructive" },
  ],
  ON_HOLD: [
    { label: "Obnovit realizaci", target: "IN_PROGRESS", variant: "default" },
    { label: "Zrušit", target: "CANCELLED", variant: "destructive" },
  ],
  COMPLETED: [
    { label: "Znovu otevřít", target: "IN_PROGRESS", variant: "outline" },
  ],
  CANCELLED: [
    { label: "Znovu otevřít", target: "NEW", variant: "outline" },
  ],
};

export function StatusChanger({
  projectId,
  currentStatus,
}: {
  projectId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const availableTransitions = transitions[currentStatus] ?? [];

  async function handleChange(target: Status) {
    startTransition(async () => {
      await updateProjectStatus(projectId, target);
      router.refresh();
    });
  }

  if (availableTransitions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {availableTransitions.map((t) => (
        <Button
          key={t.target}
          variant={t.variant}
          size="sm"
          disabled={isPending}
          onClick={() => handleChange(t.target)}
        >
          {isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
          {t.label}
        </Button>
      ))}
    </div>
  );
}
