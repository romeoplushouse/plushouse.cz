"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createContact, updateContact } from "@/lib/actions/contacts";
import { Loader2 } from "lucide-react";

const contactSchema = z.object({
  type: z.enum(["CUSTOMER", "SUPPLIER", "SUBCONTRACTOR", "EMPLOYEE_CONTACT", "OTHER"], {
    message: "Vyberte typ kontaktu",
  }),
  companyName: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  ico: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{8}$/.test(val), {
      message: "ICO musi mit 8 cislic",
    }),
  dic: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  zip: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{3}\s?\d{2}$/.test(val), {
      message: "PSC musi mit format 123 45 nebo 12345",
    }),
  country: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine((val) => !val || z.string().email().safeParse(val).success, {
      message: "Zadejte platny email",
    }),
  phone: z.string().optional(),
  website: z.string().optional(),
  bankAccount: z.string().optional(),
  bankCode: z.string().optional(),
  notes: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

const TYPE_OPTIONS = [
  { value: "CUSTOMER", label: "Zakaznik" },
  { value: "SUPPLIER", label: "Dodavatel" },
  { value: "SUBCONTRACTOR", label: "Subdodavatel" },
  { value: "EMPLOYEE_CONTACT", label: "Kontakt zamestnance" },
  { value: "OTHER", label: "Ostatni" },
] as const;

interface ContactFormProps {
  contactId?: string;
  defaultValues?: Partial<ContactFormData>;
  mode?: "create" | "edit";
}

export function ContactForm({ contactId, defaultValues, mode = "create" }: ContactFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      type: "CUSTOMER",
      country: "CZ",
      ...defaultValues,
    },
  });

  function onSubmit(data: ContactFormData) {
    setServerError(null);
    startTransition(async () => {
      try {
        if (mode === "edit" && contactId) {
          const updateData = { ...data };
          delete (updateData as Record<string, unknown>).type;
          await updateContact(contactId, updateData);
          router.push(`/crm/${contactId}`);
        } else {
          await createContact(data as Parameters<typeof createContact>[0]);
          router.push("/crm");
        }
        router.refresh();
      } catch {
        setServerError("Doslo k chybe pri ukladani kontaktu. Zkuste to znovu.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">{serverError}</p>
        </div>
      )}

      {/* Typ kontaktu */}
      <Card>
        <CardHeader>
          <CardTitle>Typ kontaktu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 cursor-pointer hover:bg-gray-50 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50"
              >
                <input
                  type="radio"
                  value={opt.value}
                  {...register("type")}
                  className="accent-blue-600"
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
          {errors.type && (
            <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Zakladni udaje */}
      <Card>
        <CardHeader>
          <CardTitle>Zakladni udaje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nazev firmy
            </label>
            <Input {...register("companyName")} placeholder="Nazev firmy" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jmeno
              </label>
              <Input {...register("firstName")} placeholder="Jmeno" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prijmeni
              </label>
              <Input {...register("lastName")} placeholder="Prijmeni" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ICO
              </label>
              <Input {...register("ico")} placeholder="12345678" />
              {errors.ico && (
                <p className="mt-1 text-sm text-red-600">{errors.ico.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DIC
              </label>
              <Input {...register("dic")} placeholder="CZ12345678" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adresa */}
      <Card>
        <CardHeader>
          <CardTitle>Adresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ulice
            </label>
            <Input {...register("street")} placeholder="Ulice a cislo popisne" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PSC
              </label>
              <Input {...register("zip")} placeholder="123 45" />
              {errors.zip && (
                <p className="mt-1 text-sm text-red-600">{errors.zip.message}</p>
              )}
            </div>
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mesto
              </label>
              <Input {...register("city")} placeholder="Mesto" />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zeme
              </label>
              <Input {...register("country")} placeholder="CZ" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kontaktni udaje */}
      <Card>
        <CardHeader>
          <CardTitle>Kontaktni udaje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input {...register("email")} type="email" placeholder="email@firma.cz" />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon
              </label>
              <Input {...register("phone")} type="tel" placeholder="+420 123 456 789" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Web
            </label>
            <Input {...register("website")} placeholder="https://www.firma.cz" />
          </div>
        </CardContent>
      </Card>

      {/* Bankovni udaje */}
      <Card>
        <CardHeader>
          <CardTitle>Bankovni udaje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cislo uctu
              </label>
              <Input {...register("bankAccount")} placeholder="1234567890" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kod banky
              </label>
              <Input {...register("bankCode")} placeholder="0100" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Poznamky */}
      <Card>
        <CardHeader>
          <CardTitle>Poznamky</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            {...register("notes")}
            rows={4}
            placeholder="Poznamky ke kontaktu..."
            className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
          />
        </CardContent>
      </Card>

      {/* Akce */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Zrusit
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "edit" ? "Ulozit zmeny" : "Vytvorit kontakt"}
        </Button>
      </div>
    </form>
  );
}
