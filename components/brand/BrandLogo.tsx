import { BrandMark } from "@/components/brand/BrandMark";
import { BRAND } from "@/lib/brand";

/** Mark + product name. `tone` picks the text colour for dark or light backgrounds. */
export function BrandLogo({ tone = "dark", size = "md", className = "" }: { tone?: "dark" | "light"; size?: "sm" | "md" | "lg"; className?: string }) {
  const mark = size === "lg" ? "w-11 h-11" : size === "sm" ? "w-7 h-7" : "w-9 h-9";
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandMark className={`${mark} shrink-0`} />
      <span className={`font-display font-bold tracking-tight ${text} ${tone === "dark" ? "text-white" : "text-navy-900"}`}>{BRAND.name}</span>
    </span>
  );
}
