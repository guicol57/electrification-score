// ---- Shared A→E grades (Particulier + Entreprise) ----

export interface ScoreGrade {
  g: string
  c: string
  t: string
}

export function getElecScore(pct: number): ScoreGrade {
  if (pct >= 80) return { g: "A", c: "#319834", t: "Excellent" }
  if (pct >= 60) return { g: "B", c: "#33cc33", t: "Bon" }
  if (pct >= 40) return { g: "C", c: "#cbdb2a", t: "Moyen" }
  if (pct >= 20) return { g: "D", c: "#ffad00", t: "Faible" }
  return { g: "E", c: "#e2001a", t: "Très faible" }
}

export function getFossilScore(pct: number): ScoreGrade {
  if (pct <= 10) return { g: "A", c: "#319834", t: "Très faible" }
  if (pct <= 30) return { g: "B", c: "#33cc33", t: "Faible" }
  if (pct <= 50) return { g: "C", c: "#cbdb2a", t: "Moyenne" }
  if (pct <= 75) return { g: "D", c: "#ffad00", t: "Élevée" }
  return { g: "E", c: "#e2001a", t: "Très élevée" }
}

export function roundTen(v: number): number {
  return Math.round(v / 10) * 10
}
