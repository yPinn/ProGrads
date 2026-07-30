import type { AdmissionSeasonInfo } from "@prograds/shared";
import { formatDate } from "~/utils/format";

// Builds the season summary line (fees / brochure announcement date) from whichever parts are
// present. A util rather than inline template v-ifs because all parts can be absent independently
// — chaining v-ifs in the template would leave stray leading "·" separators. Fee-waiver eligibility
// is deliberately left out of this line — not relevant enough to surface at a glance.
export function seasonLine(season: AdmissionSeasonInfo | null): string {
  if (!season) return "";
  const parts: string[] = [];
  if (season.applicationFee !== null)
    parts.push(`報名費 ${season.applicationFee.toLocaleString("zh-TW")}`);
  if (season.interviewFee !== null)
    parts.push(`口試費 ${season.interviewFee.toLocaleString("zh-TW")}`);
  if (season.announcedAt !== null) parts.push(`簡章公告 ${formatDate(season.announcedAt)}`);
  return parts.join(" · ");
}
