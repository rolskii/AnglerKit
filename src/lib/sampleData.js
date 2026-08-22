import { base44 } from "@/api/base44Client";

// A curated starter set of sample gear & catches for new accounts. Names are
// aligned across entities so rod/reel/line pairings and catch references render
// correctly. Each user who loads samples gets their own copies (owned by them),
// so they can edit or delete freely without affecting anyone else's data.

const TROUT_ROD = "Trout Stream 9' 5wt";
const STEEL_ROD = "Steelhead 10' 7wt";
const TROUT_REEL = "Trout Reel";
const STEEL_REEL = "Steelhead Reel";
const TROUT_LINE = "Rio Gold WF5";
const STEEL_LINE = "Airflo Rage 7";

export const SAMPLE_DATA = {
  Rod: [
    { name: TROUT_ROD, species: "Trout", brand: "Sage", model: "R8 Core", length: "9'", line_weight: "5", type: "Fly", material: "Carbon", condition: "Good", value: 850, date_acquired: "2023-04-15" },
    { name: STEEL_ROD, species: "Steelhead", brand: "G. Loomis", model: "NRX+", length: "10'", line_weight: "7", type: "Fly", material: "Carbon", condition: "Like New", value: 650, date_acquired: "2022-09-10" },
  ],
  Reel: [
    { name: TROUT_REEL, species: "Trout", brand: "Ross", model: "Evolution R", size: "4/5", type: "Fly", condition: "Good", value: 350, date_acquired: "2023-04-15" },
    { name: STEEL_REEL, species: "Steelhead", brand: "Hatch", model: "Finatic 7", size: "7/8", type: "Fly", condition: "Like New", value: 550, date_acquired: "2022-09-10" },
  ],
  FlyLine: [
    { brand: "Rio", model: "Gold", type: "WF", rod_type: "Fly", line_weight: "5", species: "Trout", colour: "Olive", condition: "Good", value: 95, rod: TROUT_ROD, reel: TROUT_REEL, spooled: false, date_acquired: "2023-04-15", description: "Weight-forward floating line" },
    { brand: "Airflo", model: "Rage", type: "Sinking", rod_type: "Fly", line_weight: "7", species: "Steelhead", colour: "Orange", condition: "Like New", value: 110, rod: STEEL_ROD, reel: STEEL_REEL, spooled: false, date_acquired: "2022-09-10", description: "Floating-running-line with sinking tip" },
  ],
  Lure: [
    { name: "Woolly Bugger", type: "Fly", category: "Streamer", size: "#6", colour: "Olive", quantity: 6, condition: "Good", value: 3 },
    { name: "Pheasant Tail Nymph", type: "Fly", category: "Nymph", size: "#16", colour: "Natural", quantity: 8, condition: "Good", value: 2.5 },
    { name: "Elk Hair Caddis", type: "Fly", category: "Dry Fly", size: "#14", colour: "Tan", quantity: 5, condition: "Good", value: 2.75 },
  ],
  MiscItem: [
    { name: "Wading Boots", category: "Apparel", brand: "Simms", model: "Freestone", colour: "Brown", quantity: 1, condition: "Good", value: 250 },
    { name: "Landing Net", category: "Accessory", brand: "Fishpond", model: "Brookie", colour: "Walnut", quantity: 1, condition: "Like New", value: 120 },
  ],
  Supply: [
    { name: "Dry Fly Hooks", category: "Hooks", brand: "Tiemco", model: "TMC100 #14", quantity: 50, condition: "New", value: 8 },
    { name: "Uni-Thread", category: "Thread/Floss", brand: "Veevus", model: "70 Denier", colour: "Black", quantity: 2, condition: "New", value: 4 },
    { name: "Tapered Leader", category: "Leader/Tippet", brand: "Rio", model: "Powerflex 9' 5X", quantity: 3, condition: "New", value: 5 },
  ],
  Catch: [
    { species: "Brown Trout", date: "2026-06-12", location: "Credit River, ON", length: 16, girth: 9, weight: 1.4, fly_used: "Pheasant Tail Nymph", rod: TROUT_ROD, reel: TROUT_REEL, line: TROUT_LINE, conditions: "Overcast, light wind", water_temp: 13, released: true, notes: "Rising fish in the riffle." },
    { species: "Rainbow Trout", date: "2026-04-03", location: "Saugeen River, ON", length: 24, girth: 13, weight: 6.2, fly_used: "Woolly Bugger", rod: STEEL_ROD, reel: STEEL_REEL, line: STEEL_LINE, conditions: "Slightly stained, moderate flow", water_temp: 8, released: true, notes: "Fresh chrome hen." },
    { species: "Smallmouth Bass", date: "2026-07-20", location: "Grand River, ON", length: 14, girth: 8, weight: 1.1, fly_used: "Elk Hair Caddis", rod: TROUT_ROD, reel: TROUT_REEL, line: TROUT_LINE, conditions: "Sunny, warm", water_temp: 20, released: true, notes: "Topwater take in the evening." },
  ],
};

// Creates a copy of the full sample set in the current user's account.
// Returns { results: { Entity: count }, total }.
export async function seedSampleData() {
  const results = {};
  for (const [entity, records] of Object.entries(SAMPLE_DATA)) {
    if (!records.length) continue;
    const created = await base44.entities[entity].bulkCreate(records.map((r) => ({ ...r })));
    results[entity] = Array.isArray(created) ? created.length : 0;
  }
  const total = Object.values(results).reduce((sum, n) => sum + (n || 0), 0);
  return { results, total };
}