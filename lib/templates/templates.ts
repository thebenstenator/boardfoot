export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  wasteFactor: number;
  lumberItems: TempllateLumberItem[];
  hardwareItems: TemplateHardwareItem[];
  finishItems: TemplateFinishItem[];
}

export interface TempllateLumberItem {
  species: string;
  thickness_in: number;
  width_in: number;
  length_ft: number;
  length_unit: "ft" | "in";
  quantity: number;
  pricing_mode: "per_bf" | "per_lf";
  price_per_unit: number;
  notes: string;
}

export interface TemplateHardwareItem {
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  notes: string;
}

export interface TemplateFinishItem {
  description: string;
  container_cost: number;
  container_size: number | null;
  amount_used: number | null;
  fraction_used: number;
  unit: string;
  notes: string;
}

export const TEMPLATES: ProjectTemplate[] = [
  {
    id: "cutting-board-end-grain",
    name: "End Grain Cutting Board",
    description: 'Classic end grain cutting board, approx 12" × 18"',
    category: "Kitchen",
    wasteFactor: 0.2,
    lumberItems: [
      {
        species: "Hard Maple",
        thickness_in: 1.75,
        width_in: 3,
        length_ft: 4,
        length_unit: "ft",
        quantity: 3,
        pricing_mode: "per_bf",
        price_per_unit: 8,
        notes: "",
      },
      {
        species: "Black Walnut",
        thickness_in: 1.75,
        width_in: 3,
        length_ft: 4,
        length_unit: "ft",
        quantity: 2,
        pricing_mode: "per_bf",
        price_per_unit: 15,
        notes: "",
      },
    ],
    hardwareItems: [
      {
        description: "Rubber feet (4-pack)",
        quantity: 1,
        unit: "set",
        unit_cost: 4.99,
        notes: "",
      },
    ],
    finishItems: [
      {
        description: "Food-safe mineral oil",
        container_cost: 8.99,
        container_size: 16,
        amount_used: 8,
        fraction_used: 0.5,
        unit: "oz",
        notes: "Apply 3+ coats",
      },
      {
        description: "Beeswax finish",
        container_cost: 12.99,
        container_size: 8,
        amount_used: 2,
        fraction_used: 0.25,
        unit: "oz",
        notes: "",
      },
    ],
  },
  {
    id: "floating-shelf",
    name: "Floating Shelf",
    description: 'Single floating shelf, 36" wide × 10" deep',
    category: "Storage",
    wasteFactor: 0.15,
    lumberItems: [
      {
        species: "Black Walnut",
        thickness_in: 1,
        width_in: 10,
        length_ft: 3,
        length_unit: "ft",
        quantity: 1,
        pricing_mode: "per_bf",
        price_per_unit: 15,
        notes: "",
      },
    ],
    hardwareItems: [
      {
        description: "Floating shelf brackets",
        quantity: 2,
        unit: "each",
        unit_cost: 12.99,
        notes: "",
      },
      {
        description: 'Wood screws 1-1/4"',
        quantity: 1,
        unit: "box",
        unit_cost: 5.99,
        notes: "",
      },
      {
        description: "Wall anchors",
        quantity: 1,
        unit: "box",
        unit_cost: 3.99,
        notes: "",
      },
    ],
    finishItems: [
      {
        description: "Waterlox original",
        container_cost: 32.99,
        container_size: 32,
        amount_used: 8,
        fraction_used: 0.25,
        unit: "oz",
        notes: "3 coats",
      },
      {
        description: "Sandpaper assortment (80/120/180/220)",
        container_cost: 8.99,
        container_size: 8,
        amount_used: 4,
        fraction_used: 0.5,
        unit: "sheets",
        notes: "",
      },
    ],
  },
  {
    id: "simple-bookcase",
    name: "Simple Bookcase",
    description: '5-shelf bookcase, 36" wide × 72" tall × 12" deep',
    category: "Storage",
    wasteFactor: 0.15,
    lumberItems: [
      {
        species: 'Plywood BC 3/4"',
        thickness_in: 0.75,
        width_in: 12,
        length_ft: 8,
        length_unit: "ft",
        quantity: 3,
        pricing_mode: "per_bf",
        price_per_unit: 2.5,
        notes: "Sides, shelves, back",
      },
      {
        species: "Poplar",
        thickness_in: 0.75,
        width_in: 3,
        length_ft: 8,
        length_unit: "ft",
        quantity: 2,
        pricing_mode: "per_bf",
        price_per_unit: 3.5,
        notes: "Face frame",
      },
    ],
    hardwareItems: [
      {
        description: "Shelf pins (pack of 20)",
        quantity: 1,
        unit: "box",
        unit_cost: 6.99,
        notes: "",
      },
      {
        description: 'Pocket screws 1-1/4"',
        quantity: 1,
        unit: "box",
        unit_cost: 12.99,
        notes: "",
      },
      {
        description: 'Brad nails 1-1/4"',
        quantity: 1,
        unit: "box",
        unit_cost: 7.99,
        notes: "",
      },
    ],
    finishItems: [
      {
        description: "Latex primer",
        container_cost: 18.99,
        container_size: 32,
        amount_used: 16,
        fraction_used: 0.5,
        unit: "oz",
        notes: "",
      },
      {
        description: "Semi-gloss latex paint",
        container_cost: 28.99,
        container_size: 32,
        amount_used: 24,
        fraction_used: 0.75,
        unit: "oz",
        notes: "2 coats",
      },
      {
        description: "Sandpaper 120/180/220",
        container_cost: 6.99,
        container_size: 6,
        amount_used: 4,
        fraction_used: 0.67,
        unit: "sheets",
        notes: "",
      },
    ],
  },
  {
    id: "coffee-table",
    name: "Coffee Table",
    description: 'Simple coffee table, 48" × 24" × 18" tall',
    category: "Furniture",
    wasteFactor: 0.15,
    lumberItems: [
      {
        species: "Red Oak",
        thickness_in: 1,
        width_in: 6,
        length_ft: 8,
        length_unit: "ft",
        quantity: 4,
        pricing_mode: "per_bf",
        price_per_unit: 7,
        notes: "Top panels",
      },
      {
        species: "Red Oak",
        thickness_in: 1.75,
        width_in: 1.75,
        length_ft: 8,
        length_unit: "ft",
        quantity: 2,
        pricing_mode: "per_bf",
        price_per_unit: 7,
        notes: "Legs",
      },
      {
        species: "Red Oak",
        thickness_in: 1,
        width_in: 3,
        length_ft: 8,
        length_unit: "ft",
        quantity: 2,
        pricing_mode: "per_bf",
        price_per_unit: 7,
        notes: "Aprons",
      },
    ],
    hardwareItems: [
      {
        description: "Figure-8 fasteners",
        quantity: 8,
        unit: "each",
        unit_cost: 0.75,
        notes: "For top attachment",
      },
      {
        description: "Leg levelers",
        quantity: 4,
        unit: "each",
        unit_cost: 1.99,
        notes: "",
      },
    ],
    finishItems: [
      {
        description: "Pre-stain conditioner",
        container_cost: 9.99,
        container_size: 32,
        amount_used: 12,
        fraction_used: 0.375,
        unit: "oz",
        notes: "",
      },
      {
        description: "Golden oak stain",
        container_cost: 14.99,
        container_size: 32,
        amount_used: 12,
        fraction_used: 0.375,
        unit: "oz",
        notes: "",
      },
      {
        description: "Wood glue",
        container_cost: 6.99,
        container_size: 16,
        amount_used: 8,
        fraction_used: 0.5,
        unit: "oz",
        notes: "",
      },
      {
        description: "Oil-based polyurethane",
        container_cost: 22.99,
        container_size: 32,
        amount_used: 16,
        fraction_used: 0.5,
        unit: "oz",
        notes: "3 coats",
      },
      {
        description: "Sandpaper 120/180/220",
        container_cost: 6.99,
        container_size: 6,
        amount_used: 5,
        fraction_used: 0.83,
        unit: "sheets",
        notes: "",
      },
    ],
  },
  {
    id: "nightstand",
    name: "Nightstand",
    description: 'Simple nightstand with one drawer, 18" × 16" × 26" tall',
    category: "Furniture",
    wasteFactor: 0.2,
    lumberItems: [
      {
        species: "Hard Maple",
        thickness_in: 1,
        width_in: 6,
        length_ft: 8,
        length_unit: "ft",
        quantity: 3,
        pricing_mode: "per_bf",
        price_per_unit: 8,
        notes: "Case parts",
      },
      {
        species: "Hard Maple",
        thickness_in: 0.5,
        width_in: 6,
        length_ft: 4,
        length_unit: "ft",
        quantity: 2,
        pricing_mode: "per_bf",
        price_per_unit: 8,
        notes: "Drawer parts",
      },
      {
        species: 'Plywood BB 1/2"',
        thickness_in: 0.5,
        width_in: 12,
        length_ft: 4,
        length_unit: "ft",
        quantity: 1,
        pricing_mode: "per_bf",
        price_per_unit: 1.75,
        notes: "Drawer bottom",
      },
    ],
    hardwareItems: [
      {
        description: 'Drawer slides 16"',
        quantity: 1,
        unit: "pair",
        unit_cost: 18.99,
        notes: "",
      },
      {
        description: "Drawer pull",
        quantity: 1,
        unit: "each",
        unit_cost: 8.99,
        notes: "",
      },
      {
        description: "Pocket screws",
        quantity: 1,
        unit: "box",
        unit_cost: 12.99,
        notes: "",
      },
    ],
    finishItems: [
      {
        description: "Hard wax oil (natural)",
        container_cost: 34.99,
        container_size: 16,
        amount_used: 6,
        fraction_used: 0.375,
        unit: "oz",
        notes: "2 coats",
      },
      {
        description: "Sandpaper 120/180/220",
        container_cost: 6.99,
        container_size: 6,
        amount_used: 5,
        fraction_used: 0.83,
        unit: "sheets",
        notes: "",
      },
    ],
  },
  {
    id: "raised-garden-bed",
    name: "Raised Garden Bed",
    description: "Cedar raised garden bed, 4' × 8' × 12\" tall",
    category: "Outdoor",
    wasteFactor: 0.1,
    lumberItems: [
      {
        species: "Cedar",
        thickness_in: 1.5,
        width_in: 11.25,
        length_ft: 8,
        length_unit: "ft",
        quantity: 4,
        pricing_mode: "per_lf",
        price_per_unit: 1.89,
        notes: "2x12 cedar boards",
      },
      {
        species: "Cedar",
        thickness_in: 3.5,
        width_in: 3.5,
        length_ft: 2,
        length_unit: "ft",
        quantity: 4,
        pricing_mode: "per_lf",
        price_per_unit: 2.49,
        notes: "4x4 corner posts",
      },
    ],
    hardwareItems: [
      {
        description: 'Exterior deck screws 3"',
        quantity: 1,
        unit: "box",
        unit_cost: 12.99,
        notes: "Galvanized or stainless",
      },
      {
        description: "L-brackets",
        quantity: 4,
        unit: "each",
        unit_cost: 2.49,
        notes: "Corner reinforcement",
      },
    ],
    finishItems: [
      {
        description: "Linseed oil (exterior)",
        container_cost: 18.99,
        container_size: 32,
        amount_used: 16,
        fraction_used: 0.5,
        unit: "oz",
        notes: "Optional — cedar is naturally rot resistant",
      },
    ],
  },
  {
    id: "picture-frame",
    name: "Picture Frame",
    description: 'Simple picture frame for 8" × 10" print',
    category: "Decor",
    wasteFactor: 0.35,
    lumberItems: [
      {
        species: "Cherry",
        thickness_in: 0.75,
        width_in: 2,
        length_ft: 6,
        length_unit: "ft",
        quantity: 1,
        pricing_mode: "per_bf",
        price_per_unit: 10,
        notes: "Miter cuts — high waste factor",
      },
    ],
    hardwareItems: [
      {
        description: "Picture frame glass 8x10",
        quantity: 1,
        unit: "each",
        unit_cost: 6.99,
        notes: "",
      },
      {
        description: "Picture frame backing",
        quantity: 1,
        unit: "each",
        unit_cost: 2.99,
        notes: "",
      },
      {
        description: "Frame hanging hardware",
        quantity: 1,
        unit: "set",
        unit_cost: 3.99,
        notes: "",
      },
      {
        description: "Biscuits or splines",
        quantity: 1,
        unit: "box",
        unit_cost: 4.99,
        notes: "For corner joints",
      },
    ],
    finishItems: [
      {
        description: "Danish oil",
        container_cost: 14.99,
        container_size: 16,
        amount_used: 2,
        fraction_used: 0.125,
        unit: "oz",
        notes: "",
      },
      {
        description: "Sandpaper 180/220",
        container_cost: 4.99,
        container_size: 4,
        amount_used: 3,
        fraction_used: 0.75,
        unit: "sheets",
        notes: "",
      },
    ],
  },
  {
    id: "workbench",
    name: "Simple Workbench",
    description: 'Basic workbench, 60" × 24" × 34" tall',
    category: "Shop",
    wasteFactor: 0.15,
    lumberItems: [
      {
        species: "Douglas Fir",
        thickness_in: 1.5,
        width_in: 3.5,
        length_ft: 8,
        length_unit: "ft",
        quantity: 6,
        pricing_mode: "per_lf",
        price_per_unit: 0.89,
        notes: "2x4 framing",
      },
      {
        species: "Douglas Fir",
        thickness_in: 1.5,
        width_in: 5.5,
        length_ft: 8,
        length_unit: "ft",
        quantity: 4,
        pricing_mode: "per_lf",
        price_per_unit: 1.29,
        notes: "2x6 top",
      },
      {
        species: 'Plywood BC 3/4"',
        thickness_in: 0.75,
        width_in: 24,
        length_ft: 5,
        length_unit: "ft",
        quantity: 1,
        pricing_mode: "per_bf",
        price_per_unit: 2.5,
        notes: "Lower shelf",
      },
    ],
    hardwareItems: [
      {
        description: 'Lag screws 3/8" × 3"',
        quantity: 1,
        unit: "box",
        unit_cost: 8.99,
        notes: "For leg joints",
      },
      {
        description: 'Construction screws 3"',
        quantity: 1,
        unit: "box",
        unit_cost: 9.99,
        notes: "",
      },
    ],
    finishItems: [
      {
        description: "Boiled linseed oil",
        container_cost: 14.99,
        container_size: 32,
        amount_used: 16,
        fraction_used: 0.5,
        unit: "oz",
        notes: "Optional protective coat",
      },
      {
        description: "Wood glue",
        container_cost: 6.99,
        container_size: 16,
        amount_used: 8,
        fraction_used: 0.5,
        unit: "oz",
        notes: "",
      },
    ],
  },
];

export const TEMPLATE_CATEGORIES = [
  ...new Set(TEMPLATES.map((t) => t.category)),
];
