import { TrialBalanceClient } from "./trial-balance-client";

export default function TrialBalancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Predvaha</h1>
        <p className="text-gray-500">
          Prehled obratu a zustatku vsech uctu (Trial Balance)
        </p>
      </div>
      <TrialBalanceClient />
    </div>
  );
}
