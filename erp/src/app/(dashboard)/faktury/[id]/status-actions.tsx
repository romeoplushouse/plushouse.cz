"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateInvoiceStatus } from "@/lib/actions/invoices";
import { Loader2, Send, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

const STATUS_TRANSITIONS: Record<
  string,
  Array<{
    target: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED" | "PARTIALLY_PAID";
    label: string;
    icon: typeof Send;
    variant: "default" | "outline" | "destructive" | "secondary";
  }>
> = {
  DRAFT: [
    { target: "SENT", label: "Odeslat", icon: Send, variant: "default" },
    { target: "CANCELLED", label: "Zrusit", icon: XCircle, variant: "destructive" },
  ],
  SENT: [
    { target: "PAID", label: "Oznacit jako uhrazenou", icon: CheckCircle, variant: "default" },
    { target: "PARTIALLY_PAID", label: "Castecna uhrada", icon: CheckCircle, variant: "outline" },
    { target: "OVERDUE", label: "Po splatnosti", icon: AlertTriangle, variant: "destructive" },
    { target: "CANCELLED", label: "Zrusit", icon: XCircle, variant: "destructive" },
  ],
  PARTIALLY_PAID: [
    { target: "PAID", label: "Oznacit jako uhrazenou", icon: CheckCircle, variant: "default" },
    { target: "OVERDUE", label: "Po splatnosti", icon: AlertTriangle, variant: "destructive" },
  ],
  OVERDUE: [
    { target: "PAID", label: "Oznacit jako uhrazenou", icon: CheckCircle, variant: "default" },
    { target: "PARTIALLY_PAID", label: "Castecna uhrada", icon: CheckCircle, variant: "outline" },
    { target: "CANCELLED", label: "Zrusit", icon: XCircle, variant: "destructive" },
  ],
  PAID: [],
  CANCELLED: [
    { target: "DRAFT", label: "Obnovit jako koncept", icon: Send, variant: "outline" },
  ],
};

export default function InvoiceStatusActions({
  invoiceId,
  currentStatus,
}: {
  invoiceId: string;
  currentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const transitions = STATUS_TRANSITIONS[currentStatus] || [];

  function handleStatusChange(
    target: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED" | "PARTIALLY_PAID"
  ) {
    startTransition(async () => {
      await updateInvoiceStatus(invoiceId, target);
      router.refresh();
    });
  }

  if (transitions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Akce</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {transitions.map((t) => {
          const Icon = t.icon;
          return (
            <Button
              key={t.target}
              variant={t.variant}
              className="w-full justify-start"
              disabled={isPending}
              onClick={() => handleStatusChange(t.target)}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Icon className="h-4 w-4 mr-2" />
              )}
              {t.label}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
