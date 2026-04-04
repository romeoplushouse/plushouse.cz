import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-xl border border-[#2a2d35] bg-[#1a1d24] px-3.5 py-2 text-sm text-gray-100 transition-all duration-200 placeholder:text-gray-500 hover:border-[#3a3d45] focus:outline-none focus:ring-2 focus:ring-[#B5E126]/20 focus:border-[#B5E126] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#0f1117]",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
