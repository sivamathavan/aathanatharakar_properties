// Class names for a table that turns into a list of cards on phones: each row
// wraps its cells side by side, the header row hides, and small labels name the
// values. From md up it is an ordinary table. Use `order-first w-full md:w-auto`
// on the cell that should lead the card (e.g. a status).
export const ST = {
  table: "w-full text-sm block md:table",
  thead: "hidden md:table-header-group",
  tbody: "block md:table-row-group",
  tr: "flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-[#E4DED2] py-3 first:border-t-0 md:first:border-t md:table-row md:py-0",
  td: "md:table-cell",
  label: "md:hidden text-xs text-navy-600 mr-1",
};
