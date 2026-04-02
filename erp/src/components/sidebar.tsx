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
  Gauge,
  LogOut,
  X,
  DollarSign,
} from "lucide-react";

const navSections = [
  {
    label: "HLAVNÍ",
    items: [
      { name: "Přehled", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "FINANCE",
    items: [
      { name: "Účetnictví", href: "/ucetnictvi", icon: BookOpen },
      { name: "Faktury", href: "/faktury", icon: FileText },
      { name: "Nabídky", href: "/faktury/nabidky", icon: Receipt },
      { name: "Platby", href: "/platby", icon: CreditCard },
      { name: "Daně", href: "/ucetnictvi/dane", icon: DollarSign },
    ],
  },
  {
    label: "OBCHOD",
    items: [
      { name: "Zakázky", href: "/zakazky", icon: FolderKanban },
      { name: "CRM / Adresář", href: "/crm", icon: Users },
      { name: "Subdodavatelé", href: "/subdodavatele", icon: Hammer },
    ],
  },
  {
    label: "LIDÉ",
    items: [
      { name: "Zaměstnanci", href: "/mzdy", icon: Building2 },
      { name: "GPS Sledování", href: "/sledovani", icon: MapPin },
      { name: "Tachograf", href: "/sledovani/tachograf", icon: Gauge },
    ],
  },
  {
    label: "SYSTÉM",
    items: [
      { name: "Nastavení", href: "/nastaveni", icon: Settings },
    ],
  },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col lg:static lg:z-auto",
          "bg-gradient-to-b from-[#0f172a] to-[#1e293b]",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo area */}
        <div className="flex h-16 items-center justify-between px-5 shrink-0">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-500/25 transition-shadow group-hover:shadow-blue-500/40">
              PH
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-semibold text-white leading-tight">PlusHouse</span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">ERP System</span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-white/[0.06]" />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navSections.map((section) => (
            <div key={section.label}>
              <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                {section.label}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
                        isActive
                          ? "bg-blue-500/[0.12] text-blue-400"
                          : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                      )}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-blue-400" />
                      )}
                      <item.icon
                        className={cn(
                          "h-[18px] w-[18px] shrink-0 transition-colors duration-150",
                          isActive
                            ? "text-blue-400"
                            : "text-slate-500 group-hover:text-slate-300"
                        )}
                        strokeWidth={1.75}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Divider */}
        <div className="mx-4 h-px bg-white/[0.06]" />

        {/* Bottom user section */}
        <div className="shrink-0 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-[11px] font-bold text-white shadow-sm">
              A
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-slate-200 truncate">Admin</div>
              <div className="text-[11px] text-slate-500 truncate">admin@plushouse.cz</div>
            </div>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white/10 hover:text-slate-300 transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
