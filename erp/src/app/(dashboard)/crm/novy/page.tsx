import { ContactForm } from "@/components/contacts/contact-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewContactPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/crm">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novy kontakt</h1>
          <p className="text-gray-500">Vyplnte udaje noveho kontaktu</p>
        </div>
      </div>

      <ContactForm mode="create" />
    </div>
  );
}
