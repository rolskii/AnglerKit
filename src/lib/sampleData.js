import { base44 } from "@/api/base44Client";

// A curated starter set of sample gear & catches for new accounts. Names are
// aligned across entities so rod/reel/line pairings and catch references render
// correctly, and every item ships with a representative photo. Each user who
// loads samples gets their own copies (owned by them), so they can edit or
// delete freely without affecting anyone else's data.

const IMG = {
  troutRod: "https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/bae8af78c_generated_image.png",
  steelRod: "https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/aaba557c8_generated_image.png",
  troutReel: "https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/b92cbb0fe_generated_image.png",
  steelReel: "https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/b41aaa68c_generated_image.png",
  troutLine: "https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/f810e949c_generated_image.png",
  steelLine: "https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/1d524d221_generated_image.png",
  bugger: "https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/2ebc5f410_generated_image.png",
  ptn: "https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/c09bd642e_generated_image.png",
  caddis: "https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/71a8bf7b8_generated_image.png",
  boots: "https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/68759535b_generated_image.png",
  net: "https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/7d934337e_generated_image.png",
  hooks: "https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/def5e82b8_generated_image.png",
  thread: "https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/f7166a027_generated_image.png",
  leader: "https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/b22e6dbb8_generated_image.png",
  brownTrout: "https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/c98fbee6b_generated_image.png",
  steelhead: "https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/212707530_generated_image.png",
  smallmouth: "https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/881870871_generated_image.png",
};

const TROUT_ROD = "Trout Stream 9' 5wt";
const STEEL_ROD = "Steelhead 10' 7wt";
const TROUT_REEL = "Trout Reel";
const STEEL_REEL = "Steelhead Reel";
const TROUT_LINE = "Rio Gold WF5";
const STEEL_LINE = "Airflo Rage 7";

export const SAMPLE_DATA = {
  Rod: [
    { name: TROUT_ROD, species: "Trout", brand: "Sage", model: "R8 Core", length: "9'", line_weight: "5", type: "Fly", material: "Carbon", condition: "Good", value: 850, date_acquired: "2023-04-15", images: [IMG.troutRod] },
    { name: STEEL_ROD, species: "Steelhead", brand: "G. Loomis", model: "NRX+", length: "10'", line_weight: "7", type: "Fly", material: "Carbon", condition: "Like New", value: 650, date_acquired: "2022-09-10", images: [IMG.steelRod] },
  ],
  Reel: [
    { name: TROUT_REEL, species: "Trout", brand: "Ross", model: "Evolution R", size: "4/5", type: "Fly", condition: "Good", value: 350, date_acquired: "2023-04-15", images: [IMG.troutReel] },
    { name: STEEL_REEL, species: "Steelhead", brand: "Hatch", model: "Finatic 7", size: "7/8", type: "Fly", condition: "Like New", value: 550, date_acquired: "2022-09-10", images: [IMG.steelReel] },
  ],
  FlyLine: [
    { brand: "Rio", model: "Gold", type: "WF", rod_type: "Fly", line_weight: "5", species: "Trout", colour: "Olive", condition: "Good", value: 95, rod: TROUT_ROD, reel: TROUT_REEL, spooled: false, date_acquired: "2023-04-15", description: "Weight-forward floating line", images: [IMG.troutLine] },
    { brand: "Airflo", model: "Rage", type: "Sinking", rod_type: "Fly", line_weight: "7", species: "Steelhead", colour: "Orange", condition: "Like New", value: 110, rod: STEEL_ROD, reel: STEEL_REEL, spooled: false, date_acquired: "2022-09-10", description: "Floating-running-line with sinking tip", images: [IMG.steelLine] },
  ],
  Lure: [
    { name: "Woolly Bugger", type: "Fly", category: "Streamer", size: "#6", colour: "Olive", quantity: 6, condition: "Good", value: 3, images: [IMG.bugger] },
    { name: "Pheasant Tail Nymph", type: "Fly", category: "Nymph", size: "#16", colour: "Natural", quantity: 8, condition: "Good", value: 2.5, images: [IMG.ptn] },
    { name: "Elk Hair Caddis", type: "Fly", category: "Dry Fly", size: "#14", colour: "Tan", quantity: 5, condition: "Good", value: 2.75, images: [IMG.caddis] },
  ],
  MiscItem: [
    { name: "Wading Boots", category: "Apparel", brand: "Simms", model: "Freestone", colour: "Brown", quantity: 1, condition: "Good", value: 250, images: [IMG.boots] },
    { name: "Landing Net", category: "Accessory", brand: "Fishpond", model: "Brookie", colour: "Walnut", quantity: 1, condition: "Like New", value: 120, images: [IMG.net] },
  ],
  Supply: [
    { name: "Dry Fly Hooks", category: "Hooks", brand: "Tiemco", model: "TMC100 #14", quantity: 50, condition: "New", value: 8, images: [IMG.hooks] },
    { name: "Uni-Thread", category: "Thread/Floss", brand: "Veevus", model: "70 Denier", colour: "Black", quantity: 2, condition: "New", value: 4, images: [IMG.thread] },
    { name: "Tapered Leader", category: "Leader/Tippet", brand: "Rio", model: "Powerflex 9' 5X", quantity: 3, condition: "New", value: 5, images: [IMG.leader] },
  ],
  Catch: [
    { species: "Brown Trout", date: "2026-06-12", location: "Credit River, ON", length: 16, girth: 9, weight: 1.4, fly_used: "Pheasant Tail Nymph", rod: TROUT_ROD, reel: TROUT_REEL, line: TROUT_LINE, conditions: "Overcast, light wind", water_temp: 13, released: true, notes: "Rising fish in the riffle.", images: [IMG.brownTrout] },
    { species: "Rainbow Trout", date: "2026-04-03", location: "Saugeen River, ON", length: 24, girth: 13, weight: 6.2, fly_used: "Woolly Bugger", rod: STEEL_ROD, reel: STEEL_REEL, line: STEEL_LINE, conditions: "Slightly stained, moderate flow", water_temp: 8, released: true, notes: "Fresh chrome hen.", images: [IMG.steelhead] },
    { species: "Smallmouth Bass", date: "2026-07-20", location: "Grand River, ON", length: 14, girth: 8, weight: 1.1, fly_used: "Elk Hair Caddis", rod: TROUT_ROD, reel: TROUT_REEL, line: TROUT_LINE, conditions: "Sunny, warm", water_temp: 20, released: true, notes: "Topwater take in the evening.", images: [IMG.smallmouth] },
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