// Known per-school official brochure PDF endpoints, keyed by school slug. Each builder returns
// the single-page 所組代碼 brochure for a given admission_code — verified against
// exam.aca.ntu.edu.tw for NTU (content matches our quota/exam-weight fields 1:1 for admission_code
// 907/401). This is an undocumented internal endpoint (the host's root is a bare IIS default
// page, no public index), not a published API — treat as best-effort and keep the school's
// official site (AdmissionRound.sourceUrl) as the durable fallback link.
const BROCHURE_URL_BUILDERS: Record<string, (admissionCode: string) => string> = {
  ntu: (admissionCode) => `https://exam.aca.ntu.edu.tw/grab/Brochure/PDF/${admissionCode}.pdf`,
};

export function brochureUrl(
  school: string | undefined,
  admissionCode: string | null,
): string | null {
  if (!school || !admissionCode) return null;
  return BROCHURE_URL_BUILDERS[school]?.(admissionCode) ?? null;
}
