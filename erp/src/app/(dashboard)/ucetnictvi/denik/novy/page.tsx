export const dynamic = "force-dynamic";
import { getChartOfAccounts } from "@/lib/actions/accounting";
import { JournalEntryForm } from "./journal-entry-form";

export default async function NewJournalEntryPage() {
  const accounts = await getChartOfAccounts();

  const serializedAccounts = accounts.map((a) => ({
    code: a.code,
    name: a.name,
    type: a.type,
    group: a.group,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Novy ucetni zapis</h1>
        <p className="text-gray-500">
          Vytvorte novy zapis do ucetniho deniku
        </p>
      </div>
      <JournalEntryForm accounts={serializedAccounts} />
    </div>
  );
}
