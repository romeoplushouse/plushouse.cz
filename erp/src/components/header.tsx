"use client";

import { Bell, Search, User } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function Header() {
  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Hledat faktury, kontakty, zakázky..."
            className="pl-10"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
        </Button>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
