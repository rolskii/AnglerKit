// Shared path data for the app's fish glyph, used by both the brand mark
// (TroutIcon) and the moon-phase fishing rating icon (FishIcon), so the
// brand and in-app iconography stay visually consistent.
//
// Traced directly from the original permit fish artwork (Permit_Wt.png) so
// the vector glyph matches the brand's actual silhouette, including the
// serrated trailing edge of the dorsal fin. Single closed path, no eye
// detail (the source artwork has none either) — renders via currentColor
// so it recolors cleanly on any background, no compositing tricks needed.
export const FISH_GLYPH_PATH =
  "M0.6 8.8 L2.69 9.79 L5.15 11.85 L2.57 14.18 L0.66 15.29 L1.68 15.32 " +
  "L2.81 14.99 L7.87 12.45 L8.41 12.51 L8.86 12.75 L8.08 12.78 L10.59 14.96 " +
  "L11.67 16.55 L11.37 17.21 L9.25 18.61 L11.82 17.71 L14.15 16.04 L14.45 16.16 " +
  "L14.69 15.92 L14.81 16.1 L15.17 15.77 L17.24 15.41 L17.18 16.4 L17.36 16.43 " +
  "L18.28 15.23 L20.32 14.72 L22.32 13.86 L23.22 13.29 L22.95 13.11 L23.4 12.75 " +
  "L23.4 11.85 L23.04 11.22 L21.51 9.52 L20.14 8.62 L17.42 7.63 L17.21 7.78 " +
  "L16.4 7.48 L16.07 7.63 L15.86 7.42 L15.53 7.54 L14.45 7.33 L12.12 6.08 " +
  "L9.91 5.39 L7.54 5.42 L9.58 5.69 L11.19 6.31 L11.7 6.88 L11.67 7.39 " +
  "L7.9 11.1 L8.35 11.07 L7.75 11.22 L4.94 9.7 L2.46 8.74 Z";
