/** The product mark: a house with a share dot on a saffron tile. Reads at 16px. */
export function BrandMark({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="16" fill="#E39614" />
      <path d="M13 31 32 15l19 16" fill="none" stroke="#0C2B29" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19.5 29v19h25V29" fill="none" stroke="#0C2B29" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="38" r="4.5" fill="#0C2B29" />
    </svg>
  );
}
