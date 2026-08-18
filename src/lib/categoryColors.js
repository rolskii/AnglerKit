// Single source of truth for gear/condition category colors.
//
// Each of the 5 gear categories (Rods, Reels, Lines, Tackle, Misc. Gear) and
// 3 conditions categories (Moon, Weather, Hydrometric) gets one unique color,
// applied consistently wherever it shows up: the mobile bottom-nav flyouts
// (BottomTabBar.jsx), the Home dashboard flyouts/tiles (Home.jsx), and the
// desktop sidebar icons (Layout.jsx).
//
// The underlying HSL values live in src/index.css as --cat-* custom
// properties (with light + dark variants) and are wired into Tailwind via
// the `cat` color group in tailwind.config.js.

export const CATEGORY_CHIP = {
  rods: "bg-cat-rods-bg text-cat-rods",
  reels: "bg-cat-reels-bg text-cat-reels",
  lines: "bg-cat-lines-bg text-cat-lines",
  tackle: "bg-cat-tackle-bg text-cat-tackle",
  misc: "bg-cat-misc-bg text-cat-misc",
  supplies: "bg-cat-supplies-bg text-cat-supplies",
  moon: "bg-cat-moon-bg text-cat-moon",
  weather: "bg-cat-weather-bg text-cat-weather",
  hydro: "bg-cat-hydro-bg text-cat-hydro",
};

export const CATEGORY_TEXT = {
  rods: "text-cat-rods",
  reels: "text-cat-reels",
  lines: "text-cat-lines",
  tackle: "text-cat-tackle",
  misc: "text-cat-misc",
  supplies: "text-cat-supplies",
  moon: "text-cat-moon",
  weather: "text-cat-weather",
  hydro: "text-cat-hydro",
};

// Top-level navigation containers (Gear, Conditions, Map, Fish Log) aggregate
// multiple categories rather than representing one themselves, so they get a
// consistent neutral/primary tint instead of borrowing one child's color.
export const NEUTRAL_CHIP = "bg-primary/10 text-primary";