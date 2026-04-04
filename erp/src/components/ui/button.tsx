import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5E126]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1117] disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-[#B5E126] text-[#0f1117] font-bold shadow-sm shadow-[#B5E126]/20 hover:bg-[#b5e154] hover:shadow-md hover:shadow-[#B5E126]/30",
        destructive:
          "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30",
        outline:
          "border border-[#2a2d35] bg-transparent text-gray-300 hover:border-[#B5E126]/40 hover:text-[#B5E126] hover:bg-[#B5E126]/5",
        secondary:
          "bg-[#1a1d24] text-gray-300 border border-[#2a2d35] hover:bg-[#2a2d35] hover:text-gray-100",
        ghost:
          "text-gray-400 hover:bg-[#1a1d24] hover:text-gray-200",
        link:
          "text-[#B5E126] underline-offset-4 hover:underline",
        success:
          "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/30",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
