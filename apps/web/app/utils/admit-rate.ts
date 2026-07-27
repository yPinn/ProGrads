import type { AdmissionRound } from "@prograds/shared";

// Two distinct definitions, never mixed: 實際錄取率 (admitted/applicants) once results are
// out, else 名額錄取率 (quota/applicants) as an estimate —補教業慣用估算法, systematically
// conservative since quota is the as-published figure with no 甄試名額流用修正 applied (see
// docs/06-decisions.md — the team deliberately doesn't correct for that flow-through).
export type AdmitRate = { percent: string; estimated: boolean } | null;

export function admitRate(
  round: Pick<AdmissionRound, "quota" | "applicants" | "admitted">,
): AdmitRate {
  if (!round.applicants) return null;
  if (round.admitted !== null) {
    return {
      percent: `${((round.admitted / round.applicants) * 100).toFixed(1)}%`,
      estimated: false,
    };
  }
  if (round.quota !== null) {
    return { percent: `${((round.quota / round.applicants) * 100).toFixed(1)}%`, estimated: true };
  }
  return null;
}
