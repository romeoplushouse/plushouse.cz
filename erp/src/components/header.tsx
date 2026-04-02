"use client";

import { Bell, Search, Menu, ChevronRight } from "lucide-react";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-gray-200/80 bg-white px-4 sm:px-6">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Left: breadcrumb area */}
      <div className="hidden items-center gap-1.5 text-sm sm:flex min-w-0">
        <span className="text-gray-400">PlusHouse</span>
        <ChevronRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />
        <span className="font-medium text-gray-700 truncate">Přehled</span>
      </div>

      {/* Center: search */}
      <div className="flex flex-1 justify-center px-2">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Hledat..."
            className="h-9 w-full rounded-full border border-gray-200 bg-gray-50 pl-10 pr-20 text-sm text-gray-700 placeholder:text-gray-400 transition-colors focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden items-center gap-0.5 sm:flex">
            <kbd className="flex h-5 items-center rounded border border-gray-200 bg-gray-100 px-1.5 text-[10px] font-medium text-gray-400">
              ⌘
            </kbd>
            <kbd className="flex h-5 items-center rounded border border-gray-200 bg-gray-100 px-1.5 text-[10px] font-medium text-gray-400">
              K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {/* User avatar */}
        <button className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-[11px] font-bold text-white shadow-sm transition-shadow hover:shadow-md">
          A
        </button>
      </div>
    </header>
  );
}
