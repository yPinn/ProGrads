import type { AdmissionRoundPaper } from "@prograds/shared";

// Orders a round's papers by their position in `tiebreak` (同分參酌順序), since that's the order
// applicants actually care about. tiebreak entries don't always name a paper (e.g. "口試成績",
// "審查成績" for review/interview-only rounds) — unmatched papers keep their original relative
// order, appended after every matched paper. Stable sort throughout.
export function papersByTiebreak(
  papers: AdmissionRoundPaper[],
  tiebreak: string[],
): AdmissionRoundPaper[] {
  return papers
    .map((paper, index) => ({ paper, index }))
    .sort((a, b) => {
      const rankA = tiebreak.indexOf(a.paper.name);
      const rankB = tiebreak.indexOf(b.paper.name);
      const orderA = rankA === -1 ? tiebreak.length + a.index : rankA;
      const orderB = rankB === -1 ? tiebreak.length + b.index : rankB;
      return orderA - orderB;
    })
    .map(({ paper }) => paper);
}
