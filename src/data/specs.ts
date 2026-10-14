export interface SpecItem {
  label: string;
  value: string;
  sub: string;
  tag?: string;
  isFact: boolean;
}

export const SPECS_DATA: SpecItem[] = [
  {
    label: "Drivetrain",
    value: "FMR / RWD",
    sub: "Front-mid engine, rear-wheel drive mechanical layout",
    isFact: true,
  },
  {
    label: "Suspension",
    value: "Double Wishbone",
    sub: "Independent double-wishbone architecture on all four corners",
    isFact: true,
  },
  {
    label: "Headlamps",
    value: "Retractable Pods",
    sub: "Motorized dual pop-up sealed-beam halogen assemblies",
    isFact: true,
  },
  {
    label: "Kerb Weight",
    value: "960 kg",
    sub: "Approximately 2,116 lbs [verify] for early 1.6L base models",
    tag: "[verify]",
    isFact: false,
  },
  {
    label: "Displacement",
    value: "1.6L / 1.8L",
    sub: "DOHC 16-valve B6-ZE inline-4 (1989–93) / BP-ZE (1994+) [verify]",
    tag: "[verify]",
    isFact: false,
  },
  {
    label: "Power Output",
    value: "116 hp",
    sub: "Output rated around 116 bhp @ 6,500 rpm (1.6L model) [verify]",
    tag: "[verify]",
    isFact: false,
  },
];
