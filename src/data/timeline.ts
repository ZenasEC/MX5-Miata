export interface TimelineItem {
  year: string;
  headline: string;
  description: string;
}

export const TIMELINE_DATA: TimelineItem[] = [
  {
    year: "1989",
    headline: "The Debut",
    description:
      "Unveiled in February 1989. Engineered under the Jinba Ittai philosophy — rider and horse as one — the lightweight rear-wheel-drive roadster instantly revived the open-top sports car.",
  },
  {
    year: "1997",
    headline: "End of the NA Era",
    description:
      "First-generation NA production concluded in late 1997 with over 400,000 units built [verify]. Over eight years, its pure balance defined affordable automotive romance.",
  },
  {
    year: "1998",
    headline: "Pop-Ups Retired",
    description:
      "The second generation (NB) arrived with fixed aerodynamic headlights. Stricter global pedestrian safety regulations ended the era of retractable pods, making the NA forever unique.",
  },
];
