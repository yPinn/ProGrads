// Groups consecutive same-year items under one heading, for tables where year is the primary
// axis a reader compares across (e.g. the /coverage dev page's admissions/questions/stats
// tables). Requires items pre-sorted by year — a single forward pass, no re-sort.
export function groupByYear<T extends { year: number }>(items: T[]): { year: number; rows: T[] }[] {
  const groups: { year: number; rows: T[] }[] = [];
  for (const item of items) {
    const last = groups.at(-1);
    if (last && last.year === item.year) last.rows.push(item);
    else groups.push({ year: item.year, rows: [item] });
  }
  return groups;
}
