export type ReportType = "LOST" | "FOUND";

export interface Report {
  id: string;
  type: ReportType;
  title: string;
  category: string;
  description?: string | null;
  color?: string | null;
  location: string;
  eventDate: Date;
  createdAt: Date;
}

export interface MatchBreakdown {
  title: number;
  description: number;
  category: number;
  location: number;
  date: number;
  color: number;
}

export interface MatchResult {
  score: number;
  strength: "STRONG" | "POSSIBLE";
  reasons: string[];
  breakdown: MatchBreakdown;
}

// --- CONFIGURATION ---

const STOP_WORDS = new Set(["a", "an", "the", "and", "or", "in", "on", "at", "to", "with", "is", "lost", "found", "my", "i", "some", "of"]);

const DESCRIPTIVE_WORDS = new Set([
  "black", "white", "red", "blue", "green", "yellow", "brown", "gray", "grey", "silver", "gold",
  "dark", "light", "small", "large", "big", "little", "new", "old", "leather", "plastic", "metal"
]);

const SYNONYMS: Record<string, string> = {
  // Earbuds / AirPods
  airpod: "earbuds",
  airpods: "earbuds",
  earbud: "earbuds",
  earbuds: "earbuds",
  earphone: "earbuds",
  earphones: "earbuds",

  // Bags
  backpack: "bag",
  rucksack: "bag",
  purse: "bag",
  tote: "bag",
  handbag: "bag",

  // Laptops
  macbook: "laptop",
  notebook: "laptop",

  // Phones
  iphone: "phone",
  cellphone: "phone",
  smartphone: "phone",
  mobile: "phone",

  // Identification
  identification: "id",
  identificationcard: "id",

  // Keys
  key: "keys",
  keys: "keys",

  // Glasses
  spectacles: "glasses",

  // Umbrellas
  umbrellas: "umbrella",

  // Documents
  transcript: "document",
  transcripts: "document",
  degree: "document",
  certificate: "document",
  paper: "document",
  documents: "document",
  paperwork: "document",

  // Colors
  grey: "gray"
};

const COLOR_GROUPS = [
  new Set(["black", "charcoal", "obsidian"]),
  new Set(["blue", "navy", "indigo"]),
  new Set(["gray", "grey", "silver"]),
  new Set(["red", "maroon", "crimson"]),
  new Set(["white", "cream", "ivory", "beige"])
];

// --- UTILITIES ---

function normalizeText(text: string): string[] {
  if (!text) return [];
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 0 && !STOP_WORDS.has(w));
    
  return words.map(w => SYNONYMS[w] || w);
}

function calculateBalancedSimilarity(words1: string[], words2: string[]): number {
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  let intersection = 0;
  for (const w of set1) {
    if (set2.has(w)) intersection++;
  }
  
  if (intersection === 0) return 0;
  
  const minLen = Math.min(set1.size, set2.size);
  const union = set1.size + set2.size - intersection;
  
  const overlap = intersection / minLen;
  const jaccard = intersection / union;
  
  return ((overlap * 2) + jaccard) / 3;
}

function hasIdentityOverlap(words1: string[], words2: string[]): boolean {
  const set2 = new Set(words2);
  for (const w of words1) {
    if (set2.has(w) && !DESCRIPTIVE_WORDS.has(w)) {
      return true; 
    }
  }
  return false;
}

function calculateColorScore(c1: string, c2: string): number {
  const norm1 = c1.toLowerCase().trim();
  const norm2 = c2.toLowerCase().trim();
  
  if (norm1 === norm2) return 10;
  
  for (const group of COLOR_GROUPS) {
    if (group.has(norm1) && group.has(norm2)) return 6;
  }
  return 0;
}

function calculateDateScore(lostDate: Date, foundDate: Date): number {
  const d1 = Date.UTC(lostDate.getUTCFullYear(), lostDate.getUTCMonth(), lostDate.getUTCDate());
  const d2 = Date.UTC(foundDate.getUTCFullYear(), foundDate.getUTCMonth(), foundDate.getUTCDate());
  
  const diffDays = (d2 - d1) / (1000 * 60 * 60 * 24);
  
  if (diffDays < 0) return 0;    
  if (diffDays === 0) return 15; 
  if (diffDays <= 2) return 12;  
  if (diffDays <= 7) return 8;   
  if (diffDays <= 14) return 3;  
  return 0;
}

// --- MAIN ENGINE ---

export function calculateMatch(lost: Report, found: Report): MatchResult | null {
  if (lost.type !== "LOST" || found.type !== "FOUND") {
    return null;
  }
  
  let earnedScore = 0;
  let maxPossibleScore = 100;
  const reasons: string[] = [];
  const breakdown: MatchBreakdown = { title: 0, description: 0, category: 0, location: 0, date: 0, color: 0 };
  
  const lostTitle = normalizeText(lost.title);
  const foundTitle = normalizeText(found.title);
  const lostDesc = normalizeText(lost.description || "");
  const foundDesc = normalizeText(found.description || "");

  // --- RELEVANCE SAFEGUARD ---
  const titleHasIdentity = hasIdentityOverlap(lostTitle, foundTitle);
  
  if (!titleHasIdentity) {
    // console.log("Failed titleHasIdentity");
    return null;
  }

  // 1. TITLE (Max 25)
  const titleSim = calculateBalancedSimilarity(lostTitle, foundTitle);
  breakdown.title = titleSim * 25;
  earnedScore += breakdown.title;
  
  if (breakdown.title >= 20) reasons.push("Item titles strongly match.");
  else if (breakdown.title > 0) reasons.push("Item titles share meaningful keywords.");
  
  // 2. DESCRIPTION (Max 15)
  if (lost.description && found.description) {
    const descSim = calculateBalancedSimilarity(lostDesc, foundDesc);
    breakdown.description = descSim * 15;
    earnedScore += breakdown.description;
    if (breakdown.description >= 10) reasons.push("Descriptions share similar details.");
  } else {
    maxPossibleScore -= 15; 
  }
  
  // 3. CATEGORY (Max 15)
  const lostCat = normalizeText(lost.category);
  const foundCat = normalizeText(found.category);
  const catSim = calculateBalancedSimilarity(lostCat, foundCat);
  breakdown.category = catSim * 15;
  earnedScore += breakdown.category;
  
  if (breakdown.category === 15) reasons.push("Categories match exactly.");
  else if (breakdown.category > 0) reasons.push("Categories are closely related.");
  
  // 4. LOCATION (Max 20)
  const locSim = calculateBalancedSimilarity(normalizeText(lost.location), normalizeText(found.location));
  breakdown.location = locSim * 20;
  earnedScore += breakdown.location;
  
  if (breakdown.location === 20) reasons.push("Locations match exactly.");
  else if (breakdown.location > 0) reasons.push("Locations are closely related.");
  
  // 5. DATE (Max 15)
  breakdown.date = calculateDateScore(lost.eventDate, found.eventDate);
  earnedScore += breakdown.date;
  
  if (breakdown.date === 15) reasons.push("Events occurred on the exact same day.");
  else if (breakdown.date >= 8) reasons.push("Events occurred within a few days of each other.");
  
  // 6. COLOR (Max 10)
  if (lost.color && found.color) {
    breakdown.color = calculateColorScore(lost.color, found.color);
    earnedScore += breakdown.color;
    
    if (breakdown.color === 10) reasons.push("Colors match exactly.");
    else if (breakdown.color > 0) reasons.push("Colors belong to the same shade group.");
  } else {
    maxPossibleScore -= 10;
  }
  
  // --- FINAL CLASSIFICATION ---
  const percentage = Math.round((earnedScore / maxPossibleScore) * 100);
  // if (lost.title.includes("AirPods")) {
  //   console.log({ percentage, earnedScore, maxPossibleScore, breakdown });
  // }
  
  if (percentage >= 80) {
    return { score: percentage, strength: "STRONG", reasons, breakdown };
  } else if (percentage >= 60) {
    return { score: percentage, strength: "POSSIBLE", reasons, breakdown };
  }
  
  return null;
}
