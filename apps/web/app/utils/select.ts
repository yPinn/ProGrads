// Map a slug+name list (school / dept / subject) into USelect(Menu) items.
// Shared by the filter dropdowns so the { label, value } shape lives in one place.
export function toSelectItems<T extends { slug: string; name: string }>(
  rows: T[] | undefined,
): { label: string; value: string }[] {
  return (rows ?? []).map((r) => ({ label: r.name, value: r.slug }));
}
