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
  Route,
  FileSignature,
} from "lucide-react";

const navSections = [
  {
    label: "HLAVNI",
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
      { name: "Smlouvy", href: "/smlouvy", icon: FileSignature },
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
    label: "LIDE",
    items: [
      { name: "Zaměstnanci", href: "/mzdy", icon: Building2 },
      { name: "Kniha jízd", href: "/kniha-jizd", icon: Route },
      { name: "GPS Sledování", href: "/sledovani", icon: MapPin },
      { name: "Tachograf", href: "/sledovani/tachograf", icon: Gauge },
    ],
  },
  {
    label: "SYSTEM",
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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col lg:static lg:z-auto",
          "bg-[#0a0c10]",
          "transition-transform duration-300 ease-in-out"  ,
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo area */}
        <div className="flex h-16 items-center justify-between px-5 shrink-0">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex flex-col">
              <span className="text-[16px] font-bold text-[#B5E126] tracking-tight leading-tight">
                PLUS HOUSE
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-500 flex items-center gap-1.5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#B5E126]/10 text-[#B5E126] text-[8px] font-bold tracking-wider">
                  ERP
                </span>
                System
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-white/5 hover:text-gray-300 transition-colors lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-[#2a2d35]" />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navSections.map((section) => (
            <div key={section.label}>
              <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-600">
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
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
                        isActive
                          ? "bg-[#B5E126]/10 text-[#B5E126]"
                          : "text-gray-400 hover:bg-[#1a1d24] hover:text-gray-200"
                      )}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[#B5E126]" />
                      )}
                      <item.icon
                        className={cn(
                          "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
                          isActive
                            ? "text-[#B5E126]"
                            : "text-gray-500 group-hover:text-gray-300"
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
        <div className="mx-4 h-px bg-[#2a2d35]" />

        {/* Bottom user section */}
        <div className="shrink-0 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a1d24] text-[11px] font-bold text-[#B5E126] ring-2 ring-[#B5E126]/30 shadow-sm">
              A
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-gray-200 truncate">Admin</div>
              <div className="text-[11px] text-gray-500 truncate">admin@plushouse.cz</div>
            </div>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-white/5 hover:text-gray-300 transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
