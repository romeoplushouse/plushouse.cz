export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { getContactById } from "@/lib/actions/contacts";
import { ContactDetail } from "@/components/contacts/contact-detail";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = await getContactById(id);

  if (!contact || !contact.isActive) {
    notFound();
  }

  return <ContactDetail contact={contact} />;
}
