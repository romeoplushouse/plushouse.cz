export default function SigningLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}>
            PH
          </div>
          <span className="font-semibold text-gray-900">PlusHouse ERP</span>
          <span className="text-gray-400 text-sm">• Elektronický podpis</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8">
        {children}
      </main>
      <footer className="text-center py-6 text-xs text-gray-400">
        Elektronický podpis dle nařízení EU č. 910/2014 (eIDAS) a zákona č. 297/2016 Sb.
      </footer>
    </div>
  );
}
