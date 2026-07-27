import type { AdmissionSeasonInfo } from "@prograds/shared";
import { FEE_WAIVER_LABELS } from "~/utils/admission-labels";
import { formatDate } from "~/utils/format";

// Builds the season summary line (fees / waiver / brochure announcement date) from whichever
// parts are present. A util rather than inline template v-ifs because all four parts can be
// absent independently — chaining v-ifs in the template would leave stray leading "·" separators.
export function seasonLine(season: AdmissionSeasonInfo | null): string {
  if (!season) return "";
  const parts: string[] = [];
  if (season.applicationFee !== null)
    parts.push(`報名費 ${season.applicationFee.toLocaleString("zh-TW")}`);
  if (season.interviewFee !== null)
    parts.push(`口試費 ${season.interviewFee.toLocaleString("zh-TW")}`);
  if (season.feeWaiver.length) {
    parts.push(`減免 ${season.feeWaiver.map((w) => FEE_WAIVER_LABELS[w] ?? w).join("、")}`);
  }
  if (season.announcedAt !== null) parts.push(`簡章公告 ${formatDate(season.announcedAt)}`);
  return parts.join(" · ");
}
