// Shared logic for the "Scan Gear" AI camera feature.
// One photo is uploaded, then run through Base44's ExtractDataFromUploadedFile
// with the schema below. The result is mapped onto whichever gear entity
// (Rod / Reel / FlyLine / Lure / MiscItem) it was identified as, and handed
// to that category's existing form as prefilled `initial` data — the user
// still reviews and confirms before anything is saved.

export const GEAR_CATEGORY_META = {
  rod: { path: "/rods", label: "Rod" },
  reel: { path: "/reels", label: "Reel" },
  fly_line: { path: "/lines", label: "Fly Line" },
  lure: { path: "/lures", label: "Fly / Lure" },
  misc: { path: "/misc", label: "Gear" },
};

// Confidence threshold below which we fall back to the Misc. Gear form
// (the catch-all category) rather than guessing wrong and confusing the user.
export const LOW_CONFIDENCE_THRESHOLD = 0.4;

export const GEAR_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    category: {
      type: "string",
      enum: ["rod", "reel", "fly_line", "lure", "misc"],
      description:
        "Which gear category this photo shows. 'fly_line' = fly line/backing/leader spools and their boxes. " +
        "'lure' = individual flies, lures, jigs, spoons, spinners. 'misc' = anything else, including fly boxes, " +
        "tackle boxes, apparel, tools, nets, and accessories.",
    },
    confidence: {
      type: "number",
      description: "0 to 1 — how confident you are in the category and the identification overall.",
    },
    identified_as: {
      type: "string",
      description: "Short human-readable identification, e.g. \"Orvis Clearwater Large Arbor 5/6 fly reel\".",
    },
    name: { type: "string", description: "A short descriptive name/title for the item." },
    brand: { type: "string", description: "Brand or manufacturer, read from labels/logos if visible." },
    model: { type: "string", description: "Model name or number, read from labels if visible." },
    species: {
      type: "string",
      enum: ["Trout", "Salmon", "Steelhead", "Bass", "Pike", "Saltwater", "Gar", "Muskie", "Anything", "Other"],
      description: "Best-guess target species this gear is suited for, only if inferable from labels/context.",
    },
    gear_type: {
      type: "string",
      enum: ["Casting", "Fly", "Spinning", "Other"],
      description: "For rod / reel / fly_line: the gear type.",
    },
    material: {
      type: "string",
      enum: ["Carbon", "Cane", "Fiberglass", "Other"],
      description: "Rod material, only for category=rod, if visible or known.",
    },
    length: { type: "string", description: "Rod length as printed, e.g. 9'0\". Only for category=rod." },
    line_weight: { type: "string", description: "Line/rod weight rating, e.g. \"5\". For rod or fly_line." },
    size: { type: "string", description: "Reel size, or hook/lure size (e.g. #14). For reel or lure." },
    colour: { type: "string", description: "Primary colour, for fly_line, lure, or misc items." },
    grain_weight: { type: "number", description: "Fly line grain weight if printed on box/label. Only for category=fly_line." },
    line_taper_type: {
      type: "string",
      enum: ["Tip", "Body", "Head", "Integrated", "Shooting", "WF", "Running", "Sinking", "System", "Other"],
      description: "Fly line taper/type as printed on the box. Only for category=fly_line.",
    },
    condition: {
      type: "string",
      enum: ["New", "Like New", "Good", "Fair", "Poor"],
      description: "Visual condition guess based on the photo.",
    },
    misc_category: {
      type: "string",
      enum: ["Apparel", "Tool", "Storage", "Accessory", "Safety", "Electronics", "Other"],
      description: "Only for category=misc.",
    },
    lure_category: {
      type: "string",
      description: "Only for category=lure, e.g. Dry Fly, Nymph, Streamer, Spinner, Spoon, Plug, Jig.",
    },
    quantity: { type: "number", description: "How many identical items are visible. For lure or misc. Default 1." },
    notes: { type: "string", description: "Any other useful detail read off labels/packaging (specs, part numbers, etc.)." },
  },
  required: ["category", "confidence"],
};

// Drops undefined/null/empty-string keys so the result can be safely spread
// over each form's own `empty` defaults without clobbering them with blanks.
function stripEmpty(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}

function displayName(data, fallback) {
  return data.name || [data.brand, data.model].filter(Boolean).join(" ") || fallback;
}

/**
 * Maps the raw extraction result (matching GEAR_EXTRACTION_SCHEMA) onto the
 * field shape expected by the given category's form/entity.
 * `category` may be overridden by the caller (e.g. low-confidence fallback to "misc").
 */
export function mapExtractionToPrefill(category, data, imageUrl) {
  const images = imageUrl ? [imageUrl] : [];

  switch (category) {
    case "rod":
      return stripEmpty({
        name: displayName(data, "Scanned Rod"),
        species: data.species,
        brand: data.brand,
        model: data.model,
        length: data.length,
        line_weight: data.line_weight,
        type: data.gear_type,
        material: data.material,
        condition: data.condition,
        notes: data.notes,
        images,
      });
    case "reel":
      return stripEmpty({
        name: displayName(data, "Scanned Reel"),
        species: data.species,
        brand: data.brand,
        model: data.model,
        size: data.size,
        type: data.gear_type,
        condition: data.condition,
        notes: data.notes,
        images,
      });
    case "fly_line":
      return stripEmpty({
        species: data.species,
        brand: data.brand,
        model: data.model,
        type: data.line_taper_type,
        rod_type: data.gear_type,
        description: data.identified_as,
        line_weight: data.line_weight,
        grain_weight: data.grain_weight,
        colour: data.colour,
        condition: data.condition,
        notes: data.notes,
        images,
      });
    case "lure":
      return stripEmpty({
        name: displayName(data, "Scanned Fly/Lure"),
        type: /fly|nymph|streamer|dry|emerger|wet/i.test(data.lure_category || "") ? "Fly" : undefined,
        category: data.lure_category,
        brand: data.brand,
        model: data.model,
        size: data.size,
        colour: data.colour,
        quantity: data.quantity,
        condition: data.condition,
        notes: data.notes,
        images,
      });
    case "misc":
    default:
      return stripEmpty({
        name: displayName(data, "Scanned Item"),
        category: data.misc_category,
        brand: data.brand,
        model: data.model,
        colour: data.colour,
        quantity: data.quantity,
        condition: data.condition,
        notes: data.notes,
        images,
      });
  }
}

export function resolveCategory(data) {
  const raw = GEAR_CATEGORY_META[data?.category] ? data.category : "misc";
  const confidence = typeof data?.confidence === "number" ? data.confidence : 0;
  return confidence < LOW_CONFIDENCE_THRESHOLD ? "misc" : raw;
}
