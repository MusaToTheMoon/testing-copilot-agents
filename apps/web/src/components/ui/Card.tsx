import type { HTMLAttributes } from "react";
import { clsx } from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({ children, className, padding = "md", ...props }: CardProps) {
  return (
    <div
      {...props}
      className={clsx(
        "bg-white rounded-xl border border-gray-200 shadow-sm",
        {
          "p-0": padding === "none",
          "p-3": padding === "sm",
          "p-5": padding === "md",
          "p-8": padding === "lg",
        },
        className,
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ children, className, ...props }: CardHeaderProps) {
  return (
    <div {...props} className={clsx("pb-4 border-b border-gray-100 mb-4", className)}>
      {children}
    </div>
  );
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ children, className, ...props }: CardTitleProps) {
  return (
    <h3 {...props} className={clsx("text-lg font-semibold text-gray-900", className)}>
      {children}
    </h3>
  );
}
