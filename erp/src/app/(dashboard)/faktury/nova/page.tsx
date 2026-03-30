import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import InvoiceForm from "@/components/invoices/invoice-form";

export default function NewInvoicePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/faktury">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova faktura</h1>
          <p className="text-gray-500">
            Vyplnte udaje a polozky nove faktury
          </p>
        </div>
      </div>
      <InvoiceForm />
    </div>
  );
}
