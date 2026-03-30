"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ContactForm } from "@/components/contacts/contact-form";
import { deleteContact } from "@/lib/actions/contacts";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Building2,
  FileText,
  Briefcase,
  CreditCard,
  MessageSquare,
} from "lucide-react";

const TYPE_MAP: Record<string, { label: string; variant: "default" | "success" | "warning" | "secondary" }> = {
  CUSTOMER: { label: "Zakaznik", variant: "default" },
  SUPPLIER: { label: "Dodavatel", variant: "success" },
  SUBCONTRACTOR: { label: "Subdodavatel", variant: "warning" },
  EMPLOYEE_CONTACT: { label: "Zamestnanec", variant: "secondary" },
  OTHER: { label: "Ostatni", variant: "secondary" },
};

const TABS = [
  { id: "detail", label: "Detail", icon: Building2 },
  { id: "invoices", label: "Faktury", icon: FileText },
  { id: "projects", label: "Zakazky", icon: Briefcase },
  { id: "payments", label: "Platby", icon: CreditCard },
  { id: "communications", label: "Komunikace", icon: MessageSquare },
] as const;

type TabId = (typeof TABS)[number]["id"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ContactDetail({ contact }: { contact: any }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("detail");
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const displayName =
    contact.companyName ||
    [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
    "Bez nazvu";

  const typeInfo = TYPE_MAP[contact.type] || TYPE_MAP.OTHER;

  function handleDelete() {
    startTransition(async () => {
      await deleteContact(contact.id);
      router.push("/crm");
      router.refresh();
    });
  }

  if (isEditing) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Upravit kontakt</h1>
            <p className="text-gray-500">{displayName}</p>
          </div>
        </div>
        <ContactForm
          mode="edit"
          contactId={contact.id}
          defaultValues={{
            type: contact.type,
            companyName: contact.companyName || "",
            firstName: contact.firstName || "",
            lastName: contact.lastName || "",
            ico: contact.ico || "",
            dic: contact.dic || "",
            street: contact.street || "",
            city: contact.city || "",
            zip: contact.zip || "",
            country: contact.country || "",
            email: contact.email || "",
            phone: contact.phone || "",
            website: contact.website || "",
            bankAccount: contact.bankAccount || "",
            bankCode: contact.bankCode || "",
            notes: contact.notes || "",
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/crm">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
              <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
            </div>
            {contact.companyName && (contact.firstName || contact.lastName) && (
              <p className="text-gray-500">
                {[contact.firstName, contact.lastName].filter(Boolean).join(" ")}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Upravit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Smazat
          </Button>
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-800">
                Opravdu chcete smazat kontakt <strong>{displayName}</strong>? Tato akce je nevratna.
              </p>
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Zrusit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  {isPending ? "Mazani..." : "Ano, smazat"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "detail" && <DetailTab contact={contact} />}
      {activeTab === "invoices" && <InvoicesTab contact={contact} />}
      {activeTab === "projects" && <ProjectsTab contact={contact} />}
      {activeTab === "payments" && <PaymentsTab contact={contact} />}
      {activeTab === "communications" && <CommunicationsTab contact={contact} />}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DetailTab({ contact }: { contact: any }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Kontaktni udaje */}
      <Card>
        <CardHeader>
          <CardTitle>Kontaktni udaje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {contact.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-400" />
              <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                {contact.email}
              </a>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gray-400" />
              <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                {contact.phone}
              </a>
            </div>
          )}
          {contact.website && (
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-gray-400" />
              <a
                href={contact.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {contact.website}
              </a>
            </div>
          )}
          {(contact.street || contact.city) && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                {contact.street && <p>{contact.street}</p>}
                <p>
                  {[contact.zip, contact.city].filter(Boolean).join(" ")}
                  {contact.country && contact.country !== "CZ" && `, ${contact.country}`}
                </p>
              </div>
            </div>
          )}
          {!contact.email && !contact.phone && !contact.website && !contact.street && !contact.city && (
            <p className="text-sm text-gray-400">Zadne kontaktni udaje</p>
          )}
        </CardContent>
      </Card>

      {/* Firemni udaje */}
      <Card>
        <CardHeader>
          <CardTitle>Firemni udaje</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3">
            {contact.ico && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">ICO</dt>
                <dd className="text-sm font-medium">{contact.ico}</dd>
              </div>
            )}
            {contact.dic && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">DIC</dt>
                <dd className="text-sm font-medium">{contact.dic}</dd>
              </div>
            )}
            {contact.bankAccount && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Bankovni ucet</dt>
                <dd className="text-sm font-medium">
                  {contact.bankAccount}
                  {contact.bankCode && `/${contact.bankCode}`}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Vytvoreno</dt>
              <dd className="text-sm font-medium">{formatDate(contact.createdAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Aktualizovano</dt>
              <dd className="text-sm font-medium">{formatDate(contact.updatedAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Poznamky */}
      {contact.notes && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Poznamky</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{contact.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Kontaktni osoby */}
      {contact.contactPersons && contact.contactPersons.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Kontaktni osoby</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jmeno</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefon</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {contact.contactPersons.map((person: any) => (
                  <TableRow key={person.id}>
                    <TableCell className="font-medium">{person.name}</TableCell>
                    <TableCell>{person.role || "-"}</TableCell>
                    <TableCell>{person.email || "-"}</TableCell>
                    <TableCell>{person.phone || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function InvoicesTab({ contact }: { contact: any }) {
  const allInvoices = [
    ...(contact.issuedInvoices || []).map((inv: Record<string, unknown>) => ({ ...inv, direction: "issued" })),
    ...(contact.receivedInvoices || []).map((inv: Record<string, unknown>) => ({ ...inv, direction: "received" })),
  ];

  if (allInvoices.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="font-medium">Zadne faktury</p>
          <p className="text-sm mt-1">K tomuto kontaktu zatim nejsou zadne faktury.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cislo</TableHead>
              <TableHead>Smer</TableHead>
              <TableHead>Datum vystaveni</TableHead>
              <TableHead>Castka</TableHead>
              <TableHead>Stav</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {allInvoices.map((inv: any) => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">{inv.number || "-"}</TableCell>
                <TableCell>
                  <Badge variant={inv.direction === "issued" ? "default" : "secondary"}>
                    {inv.direction === "issued" ? "Vydana" : "Prijata"}
                  </Badge>
                </TableCell>
                <TableCell>{inv.issueDate ? formatDate(inv.issueDate) : "-"}</TableCell>
                <TableCell>{inv.totalAmount ? formatCurrency(Number(inv.totalAmount)) : "-"}</TableCell>
                <TableCell>
                  <Badge variant={inv.status === "PAID" ? "success" : "warning"}>
                    {inv.status || "-"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ProjectsTab({ contact }: { contact: any }) {
  const projects = contact.projects || [];

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="font-medium">Zadne zakazky</p>
          <p className="text-sm mt-1">K tomuto kontaktu zatim nejsou zadne zakazky.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nazev</TableHead>
              <TableHead>Stav</TableHead>
              <TableHead>Vytvoreno</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {projects.map((project: any) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.name || "-"}</TableCell>
                <TableCell>
                  <Badge>{project.status || "-"}</Badge>
                </TableCell>
                <TableCell>{project.createdAt ? formatDate(project.createdAt) : "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PaymentsTab({ contact }: { contact: any }) {
  const payments = contact.payments || [];

  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="font-medium">Zadne platby</p>
          <p className="text-sm mt-1">K tomuto kontaktu zatim nejsou zadne platby.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Castka</TableHead>
              <TableHead>Typ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {payments.map((payment: any) => (
              <TableRow key={payment.id}>
                <TableCell>{payment.date ? formatDate(payment.date) : "-"}</TableCell>
                <TableCell className="font-medium">
                  {payment.amount ? formatCurrency(Number(payment.amount)) : "-"}
                </TableCell>
                <TableCell>{payment.type || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CommunicationsTab({ contact }: { contact: any }) {
  const communications = contact.communications || [];

  const typeLabels: Record<string, string> = {
    EMAIL: "Email",
    PHONE: "Telefon",
    MEETING: "Schuzka",
    NOTE: "Poznamka",
  };

  if (communications.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="font-medium">Zadna komunikace</p>
          <p className="text-sm mt-1">K tomuto kontaktu zatim neni zaznamenana zadna komunikace.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Predmet</TableHead>
              <TableHead>Obsah</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {communications.map((comm: any) => (
              <TableRow key={comm.id}>
                <TableCell>{comm.date ? formatDate(comm.date) : "-"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{typeLabels[comm.type] || comm.type}</Badge>
                </TableCell>
                <TableCell className="font-medium">{comm.subject || "-"}</TableCell>
                <TableCell className="max-w-xs truncate">{comm.content || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
