// Small helpers ported from the tracker.
export const formatINR = (value: number | string | null | undefined): string => {
  const num = typeof value === "number" ? value : Number(value || 0);
  if (!Number.isFinite(num)) return "₹0";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(num);
};

export const formatDateStr = (date: Date | string | null | undefined): string => {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const getWhatsAppLink = (num: string | null | undefined, message?: string): string => {
  if (!num) return "#";
  let cleaned = num.replace(/\D/g, "");
  if (cleaned.length === 10) cleaned = `91${cleaned}`;
  return `https://wa.me/${cleaned}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
};
