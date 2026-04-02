export const ELEC_SCORE_TIPS: Record<string, string> = {
  A: "A (≥80%) — Usages quasi-intégralement électrifiés. Très faible exposition aux fossiles.",
  B: "B (60-79%) — Bonne électrification. Exposition fossile faible.",
  C: "C (40-59%) — Partielle. Usages fossiles significatifs.",
  D: "D (20-39%) — Faible. Des leviers importants existent.",
  E: "E (<20%) — Très faible. Fort potentiel de transition.",
}

export const FOSSIL_SCORE_TIPS: Record<string, string> = {
  A: "A (≤10%) — Quasi-nulle. Budget très résilient face aux crises.",
  B: "B (11-30%) — Faible exposition.",
  C: "C (31-50%) — Moyenne. Choc fossile = impact sensible.",
  D: "D (51-75%) — Élevée. Forte dépendance.",
  E: "E (>75%) — Très élevée. Forte vulnérabilité.",
}
