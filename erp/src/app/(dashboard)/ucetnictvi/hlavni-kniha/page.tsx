export const dynamic = "force-dynamic";
import { getChartOfAccounts } from "@/lib/actions/accounting";
import { GeneralLedgerClient } from "./general-ledger-client";

export default async function GeneralLedgerPage() {
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
        <h1 className="text-2xl font-bold text-gray-900">Hlavni kniha</h1>
        <p className="text-gray-500">
          Zobrazeni oboru a zustatku na jednotlivych uctech
        </p>
      </div>
      <GeneralLedgerClient accounts={serializedAccounts} />
    </div>
  );
}
