import { TrialBalanceClient } from "./trial-balance-client";

export default function TrialBalancePage() {
  return (
    <div className="page-enter space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Předvaha</h1>
        <p className="text-gray-400">
          Přehled obratů a zůstatků všech účtů
        </p>
      </div>
      <TrialBalanceClient />
    </div>
  );
}
