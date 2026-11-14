/**
 * Seed catalogue — material families and series.
 * Mirrors the range seen in professional fenestration systems (aluminum, PVC/uPVC, wood,
 * fiberglass, doors, specialty). Replace rates/deductions with a real supplier datasheet.
 */

import type {
  GlassKind,
  HardwareKind,
  ItemType,
  ItemTypeRule,
  Material,
  Operation,
  OptionDef,
  RateCard,
  RoRule,
  Series,
} from "./types.ts";

const RO: Record<"std" | "masonry" | "none", RoRule> = {
  std: { measureType: "std", label: "Std RO", widthAdd: 13, heightAdd: 13, headExtra: 0 },
  masonry: { measureType: "masonry", label: "Masonry — top of riser / bottom of head", widthAdd: 102, heightAdd: 64, headExtra: 0 },
  none: { measureType: "none", label: "DLO only", widthAdd: 0, heightAdd: 0, headExtra: 0 },
};

const SLIDING_WIN: Operation[] = ["sliding2", "sliding3", "sliding4", "fixed"];
const CASEMENT_WIN: Operation[] = ["casement1", "casement2", "awning", "tilt_turn", "fixed"];
const DOORS: Operation[] = ["door_hinged", "door_sliding2", "door_patio", "door_multi_slide", "door_pocket", "door_bifold", "fixed"];
const SPECIAL: Operation[] = ["bay", "garden", "skylight", "sealed_unit", "screen_only", "fixed"];

function s(
  id: string, name: string, material: Material, family: string, ops: Operation[],
  face: number, rebate: number, stile: number, sashClear: number, overlap: number,
  rate: number, maxPanelWidth: number, maxHeight: number,
): Series {
  return { id, name, material, family, face, rebate, stile, sashClear, overlap, rate, maxPanelWidth, maxHeight, roRules: RO, operations: ops };
}

export const SERIES: Series[] = [
  // Aluminum
  s("alu-cas-50", "Aluminum Casement/Awning 50", "aluminum", "Casement/Awning", CASEMENT_WIN, 50, 10, 32, 3, 18, 420, 1100, 2100),
  s("alu-cas-70", "Aluminum Casement/Awning 70", "aluminum", "Casement/Awning", CASEMENT_WIN, 70, 12, 35, 3, 20, 560, 1400, 2400),
  s("alu-sld-70", "Aluminum Sliding Window 70", "aluminum", "Sliding Window", SLIDING_WIN, 70, 12, 35, 3, 20, 540, 1500, 2400),
  s("alu-sld-100", "Aluminum Sliding Window 100", "aluminum", "Sliding Window", SLIDING_WIN, 100, 15, 42, 4, 24, 720, 1800, 2700),
  s("alu-door-sld", "Aluminum Sliding/Patio Door", "aluminum", "Door", DOORS, 90, 14, 40, 4, 22, 780, 1600, 2700),
  s("alu-multi", "Aluminum Multi-Slide Door", "aluminum", "Door", DOORS, 100, 15, 44, 4, 24, 920, 1500, 3000),

  // PVC / uPVC
  s("pvc-cas-60", "PVC Casement/Awning 60", "pvc", "Casement/Awning", CASEMENT_WIN, 60, 12, 38, 4, 20, 480, 1000, 2200),
  s("pvc-cas-70", "PVC Casement/Awning 70", "pvc", "Casement/Awning", CASEMENT_WIN, 72, 14, 40, 4, 20, 560, 1200, 2400),
  s("pvc-sld-60", "PVC Sliding Window 60", "pvc", "Sliding Window", SLIDING_WIN, 60, 12, 38, 4, 20, 460, 1200, 2100),
  s("pvc-sld-80", "PVC Sliding Window 80", "pvc", "Sliding Window", SLIDING_WIN, 80, 14, 42, 4, 22, 600, 1400, 2400),
  s("pvc-patio", "PVC Sliding Patio Door", "pvc", "Door", DOORS, 80, 14, 42, 4, 22, 680, 1400, 2400),
  s("pvc-lift", "PVC Lift & Slide Door", "pvc", "Door", DOORS, 90, 16, 46, 4, 24, 880, 1600, 2600),

  // Wood
  s("wood-cas", "Wood Casement/Awning", "wood", "Casement/Awning", CASEMENT_WIN, 68, 14, 40, 4, 18, 820, 1100, 2300),
  s("wood-sld", "Wood Sliding Window", "wood", "Sliding Window", SLIDING_WIN, 72, 14, 42, 4, 20, 860, 1200, 2300),
  s("wood-door", "Wood Door", "wood", "Door", DOORS, 80, 16, 45, 4, 20, 980, 1200, 2400),

  // Fiberglass / composite
  s("fg-door", "Fiberglass Door", "fiberglass", "Door", DOORS, 75, 14, 42, 4, 20, 760, 1200, 2400),
  s("fg-cas", "Fiberglass Casement/Awning", "fiberglass", "Casement/Awning", CASEMENT_WIN, 70, 14, 40, 4, 20, 740, 1200, 2400),

  // Specialty / components
  s("sealed", "Sealed Unit (IGU)", "glass", "Specialty", ["sealed_unit", "fixed"], 20, 8, 20, 0, 0, 300, 2400, 2400),
  s("bay", "Bay / Bow Window", "aluminum", "Specialty", ["bay", "fixed"], 70, 12, 35, 3, 20, 700, 1200, 2400),
  s("garden", "Garden Window", "aluminum", "Specialty", ["garden", "fixed"], 60, 10, 32, 3, 18, 650, 1200, 1500),
  s("skylight", "Skylight", "aluminum", "Specialty", ["skylight", "fixed"], 70, 12, 35, 0, 0, 800, 1500, 1500),
  s("screen", "Screen Only", "screen", "Specialty", ["screen_only", "fixed"], 25, 6, 20, 2, 0, 180, 2000, 2400),
  s("dh", "Double Hung", "aluminum", "Sliding Window", ["sliding2", "fixed"], 65, 12, 34, 3, 0, 520, 1200, 2200),
];

export const MATERIAL_LABELS: Record<Material, string> = {
  aluminum: "Aluminum",
  pvc: "PVC / uPVC",
  wood: "Wood",
  fiberglass: "Fiberglass",
  composite: "Composite",
  glass: "Glass / IGU",
  screen: "Screen",
};

export const OPERATION_LABELS: Record<Operation, string> = {
  fixed: "Fixed / Picture",
  sliding2: "Sliding — 2 panel",
  sliding3: "Sliding — 3 panel",
  sliding4: "Sliding — 4 panel",
  casement1: "Casement — 1 sash",
  casement2: "Casement — 2 sash",
  awning: "Awning / Top-hung",
  tilt_turn: "Tilt & Turn",
  door_hinged: "Hinged Door",
  door_sliding2: "Sliding Door — 2 panel",
  door_patio: "Patio Door",
  door_multi_slide: "Multi-Slide Door",
  door_pocket: "Pocket Door",
  door_bifold: "Bi-fold Door",
  bay: "Bay / Bow Window",
  garden: "Garden Window",
  skylight: "Skylight",
  sealed_unit: "Sealed Unit (IGU)",
  screen_only: "Screen Only",
};

export const ITEM_TYPES: Record<ItemType, ItemTypeRule> = {
  custom: { label: "Custom design", profile: 1.0, glass: 1.0, hardware: 1.0, labour: 1.0 },
  stdDesign: { label: "Std design", profile: 0.94, glass: 0.96, hardware: 0.96, labour: 0.94 },
  stdSize: { label: "Std size product", profile: 0.86, glass: 0.88, hardware: 0.9, labour: 0.86 },
  stdEditable: { label: "Std editable product", profile: 0.9, glass: 0.92, hardware: 0.93, labour: 0.9 },
  stock: { label: "Stock product", profile: 0.8, glass: 0.84, hardware: 0.85, labour: 0.7 },
};

export const GLASS_LABELS: Record<GlassKind, string> = {
  clear: "Clear 6 mm",
  lam: "Laminated 6.38 mm",
  temp: "Tempered 6 mm",
  dgu: "Double glazed 6+12+6",
  tinted: "Tinted / Reflective 6 mm",
  lowe: "Low-E DGU",
};

export const HARDWARE_LABELS: Record<HardwareKind, string> = {
  none: "None",
  std: "Standard",
  prem: "Premium",
  heavy: "Heavy duty",
};

export const COLOURS: OptionDef = {
  id: "colour",
  category: "Finish",
  name: "Colour",
  defaultValue: "WH",
  answers: [
    { code: "WH", label: "White", rgb: [242, 242, 240], adjust: 0 },
    { code: "CL", label: "Clay / Beige", rgb: [200, 184, 166], adjust: 0 },
    { code: "SD", label: "Sandstone", rgb: [216, 203, 176], adjust: 0 },
    { code: "GR", label: "Green", rgb: [74, 95, 74], adjust: 0 },
    { code: "BR", label: "Brown / Oak", rgb: [120, 82, 52], adjust: 0.02 },
    { code: "GY", label: "Grey", rgb: [130, 136, 142], adjust: 0 },
    { code: "BK", label: "Black", rgb: [26, 26, 26], adjust: 0.03 },
    { code: "AL", label: "Almond", rgb: [232, 220, 200], adjust: 0 },
    { code: "ML", label: "Mill (raw)", rgb: [196, 200, 204], adjust: -0.04 },
    { code: "AN", label: "Anodised", rgb: [176, 180, 184], adjust: 0.06 },
    { code: "WD", label: "Woodgrain foil", rgb: [150, 110, 70], adjust: 0.1 },
    { code: "CU", label: "Custom (specify)", rgb: [128, 128, 128], adjust: 0.12, custom: true },
  ],
};

export const GRILLE_OPTIONS = ["None", "Colonial", "Prairie", "Perimeter", "SDL", "GBG"] as const;
export const SILL_OPTIONS = ["Standard", "Sloped", "Flush", "Extended", "No sill"] as const;
export const OPTIONS: OptionDef[] = [COLOURS];

export function defaultLayoutFor(operation: Operation): { cols: number; rows: number } {
  switch (operation) {
    case "sliding2": case "door_sliding2": case "door_patio": case "casement2": return { cols: 2, rows: 1 };
    case "sliding3": return { cols: 3, rows: 1 };
    case "sliding4": case "door_multi_slide": case "door_bifold": return { cols: 4, rows: 1 };
    case "bay": return { cols: 3, rows: 1 };
    default: return { cols: 1, rows: 1 };
  }
}

export const RATES: RateCard = {
  glass: { clear: 850, lam: 1450, temp: 1900, dgu: 2600, tinted: 1700, lowe: 3200 },
  hardware: { none: 0, std: 1200, prem: 2600, heavy: 4200 },
  screen: 450,
  labour: 650,
  stockBarLength: 6000,
  customColourUplift: 0.12,
  twoToneUplift: 0.08,
  rushUplift: 0.15,
};

export function getSeries(id: string): Series {
  const found = SERIES.find((x) => x.id === id);
  if (!found) throw new Error(`Unknown series: ${id}`);
  return found;
}

export function getColour(code: string) {
  const found = COLOURS.answers.find((a) => a.code === code);
  if (!found) throw new Error(`Unknown colour: ${code}`);
  return found;
}

export function seriesForMaterial(material: Material): Series[] {
  return SERIES.filter((s) => s.material === material);
}

export function materials(): Material[] {
  return [...new Set(SERIES.map((s) => s.material))];
}
