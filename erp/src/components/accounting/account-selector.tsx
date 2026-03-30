"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

type Account = {
  code: string;
  name: string;
  type: string;
  group?: string | null;
};

interface AccountSelectorProps {
  accounts: Account[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function AccountSelector({
  accounts,
  value,
  onChange,
  placeholder = "Vyberte ucet...",
  disabled = false,
  className,
}: AccountSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedAccount = accounts.find((a) => a.code === value);

  const filtered = accounts.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.code.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      (a.group && a.group.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(code: string) {
    onChange(code);
    setSearch("");
    setOpen(false);
  }

  function handleInputFocus() {
    setOpen(true);
    setSearch("");
  }

  const displayValue = open
    ? search
    : selectedAccount
      ? `${selectedAccount.code} - ${selectedAccount.name}`
      : "";

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="text"
        disabled={disabled}
        className={cn(
          "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        placeholder={placeholder}
        value={displayValue}
        onChange={(e) => {
          setSearch(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={handleInputFocus}
      />
      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              Zadny ucet nenalezen
            </div>
          ) : (
            filtered.map((account) => (
              <button
                key={account.code}
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-blue-50 transition-colors",
                  account.code === value && "bg-blue-50 font-medium"
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(account.code);
                }}
              >
                <span className="font-mono text-blue-700 font-medium min-w-[3rem]">
                  {account.code}
                </span>
                <span className="truncate">{account.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
