/**
 * Fenestra domain types.
 *
 * Pure data. No framework, no database, no React.
 */

export type Material = "aluminum" | "pvc" | "wood" | "fiberglass" | "composite" | "glass" | "screen";

export type Operation =
  | "fixed"
  | "sliding2"
  | "sliding3"
  | "sliding4"
  | "casement1"
  | "casement2"
  | "awning"
  | "tilt_turn"
  | "door_hinged"
  | "door_sliding2"
  | "door_patio"
  | "door_multi_slide"
  | "door_pocket"
  | "door_bifold"
  | "bay"
  | "garden"
  | "skylight"
  | "sealed_unit"
  | "screen_only";

export type MeasureType = "std" | "masonry" | "none";
export type ItemType = "custom" | "stdDesign" | "stdSize" | "stdEditable" | "stock";
export type GlassKind = "clear" | "lam" | "temp" | "dgu" | "tinted" | "lowe";
export type HardwareKind = "none" | "std" | "prem" | "heavy";

export interface RoRule {
  measureType: MeasureType;
  label: string;
  widthAdd: number;
  heightAdd: number;
  headExtra: number;
}

export interface Series {
  id: string;
  name: string;
  material: Material;
  family: string; // e.g. Casement/Awning, Sliding, Door, Specialty
  face: number;
  rebate: number;
  stile: number;
  sashClear: number;
  overlap: number;
  rate: number; // ₱/m base
  maxPanelWidth: number;
  maxHeight: number;
  roRules: Record<MeasureType, RoRule>;
  operations: Operation[];
}

export interface OptionAnswer {
  code: string;
  label: string;
  rgb: [number, number, number];
  adjust: number;
  custom?: boolean;
}

export interface OptionDef {
  id: string;
  category: string;
  name: string;
  answers: OptionAnswer[];
  defaultValue?: string;
}

export interface RateCard {
  glass: Record<GlassKind, number>;
  hardware: Record<HardwareKind, number>;
  screen: number;
  labour: number;
  stockBarLength: number;
  customColourUplift: number;
  twoToneUplift: number;
  rushUplift: number;
}

export interface ItemTypeRule {
  label: string;
  profile: number;
  glass: number;
  hardware: number;
  labour: number;
}

export interface GridLayout {
  /** Number of vertical divisions (columns of lites). */
  cols: number;
  /** Number of horizontal divisions (rows of lites). */
  rows: number;
  /** Custom vertical split positions as ratios 0-1 from left (length = cols-1). Overrides equal spacing. */
  vSplits?: number[];
  /** Custom horizontal split positions as ratios 0-1 from top (length = rows-1). */
  hSplits?: number[];
}

export type OpeningShape = "rect" | "arch" | "round_top" | "raked_left" | "raked_right" | "triangle";

export interface Design {
  operation: Operation;
  seriesId: string;
  itemType: ItemType;
  width: number;
  height: number;
  quantity: number;
  measureType: MeasureType;
  colourExt: string;
  colourInt: string;
  glass: GlassKind;
  hardware: HardwareKind;
  screen: boolean;
  rush: boolean;
  margin: number;
  /** Client-specific notes/specs for this unit (e.g. handle side, special glass, site ref). */
  specifics?: string;
  /** Free description / custom item label. */
  description?: string;
  reference?: string;
  /** Lite grid / shape layout (mullions & transoms). */
  layout?: GridLayout;
  /** Opening shape (freeform-ish). */
  shape?: OpeningShape;
  /** Arch/rise amount in mm for shaped tops (defaults to ~20% height). */
  archRise?: number;
  /** Grille pattern label. */
  grille?: string;
  /** Sill type. */
  sill?: string;
  /** Data-driven option selections (categoryId -> answerCode). */
  options?: Record<string, string>;
}

export interface Member { name: string; length: number; quantity: number; }
export interface Pane { width: number; height: number; area: number; }
export interface RoughOpening { width: number; height: number; rule: RoRule; adjusted: boolean; }

export interface Geometry {
  members: Member[];
  panes: Pane[];
  panels: number;
  leaves: number;
  profileLength: number;
  glassArea: number;
  series: Series;
}

export interface PriceLine { label: string; amount: number; }

export interface Price {
  lines: PriceLine[];
  subtotal: number;
  margin: number;
  total: number;
  perUnit: number;
  perSquareMetre: number;
  area: number;
  profileMetres: number;
  twoTone: boolean;
}

export interface Warning { code: string; message: string; }

export interface QuoteLineSnapshot {
  design: Design;
  geometry: Geometry;
  roughOpening: RoughOpening;
  price: Price;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}
