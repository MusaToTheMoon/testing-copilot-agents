import type { HTMLAttributes } from "react";
import { clsx } from "clsx";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ children, variant = "default", className, ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        {
          "bg-gray-100 text-gray-800": variant === "default",
          "bg-green-100 text-green-800": variant === "success",
          "bg-yellow-100 text-yellow-800": variant === "warning",
          "bg-red-100 text-red-800": variant === "error",
          "bg-blue-100 text-blue-800": variant === "info",
        },
        className,
      )}
    >
      {children}
    </span>
  );
}
