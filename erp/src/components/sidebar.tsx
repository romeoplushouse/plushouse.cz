"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  FolderKanban,
  CreditCard,
  Calculator,
  MapPin,
  Hammer,
  Settings,
  Receipt,
  Building2,
} from "lucide-react";

const navigation = [
  { name: "Přehled", href: "/", icon: LayoutDashboard },
  { name: "Účetnictví", href: "/ucetnictvi", icon: BookOpen },
  { name: "Faktury", href: "/faktury", icon: FileText },
  { name: "Nabídky", href: "/faktury/nabidky", icon: Receipt },
  { name: "Platby", href: "/platby", icon: CreditCard },
  { name: "Zakázky", href: "/zakazky", icon: FolderKanban },
  { name: "CRM / Adresář", href: "/crm", icon: Users },
  { name: "Subdodavatelé", href: "/subdodavatele", icon: Hammer },
  { name: "Zaměstnanci", href: "/mzdy", icon: Building2 },
  { name: "GPS Sledování", href: "/sledovani", icon: MapPin },
  { name: "Daně", href: "/ucetnictvi/dane", icon: Calculator },
  { name: "Nastavení", href: "/nastaveni", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-64 bg-gray-900 text-white min-h-screen">
      <div className="flex items-center h-16 px-6 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
            PH
          </div>
          <span className="text-lg font-semibold">PlusHouse ERP</span>
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-gray-800">
        <div className="text-xs text-gray-500">PlusHouse ERP v0.1.0</div>
      </div>
    </aside>
  );
}
