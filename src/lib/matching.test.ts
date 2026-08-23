import { calculateMatch, Report } from "./matching";

const baseReport: Partial<Report> = {
  createdAt: new Date(),
  eventDate: new Date("2026-08-22T00:00:00Z"),
};

function runTest(name: string, lost: Partial<Report>, found: Partial<Report>) {
  const result = calculateMatch(
    { ...baseReport, type: "LOST", ...lost } as Report,
    { ...baseReport, type: "FOUND", ...found } as Report
  );
  
  console.log(`\n--- Test: ${name} ---`);
  if (!result) {
    console.log("Result: NULL (No Match)");
  } else {
    console.log(`Result: ${result.strength} (${result.score}%)`);
    console.log(`Reasons: ${result.reasons.join(" | ")}`);
  }
}

console.log("Running Matching Engine Tests...");

// 1. AirPods/earbuds wording difference -> legitimate match
runTest("AirPods wording difference", 
  { title: "Black Apple AirPods Pro charging case", category: "Electronics", location: "Cafeteria", description: "Lost my black charging case for AirPods." },
  { title: "Dark wireless earbud case", category: "Electronics", location: "Coffee shop", description: "Found a dark earbud case." }
);

// 2. Black laptop vs black backpack → null
runTest("Black laptop vs black backpack (False Positive)", 
  { title: "Black laptop", category: "Electronics", location: "Library", color: "Black" },
  { title: "Black backpack", category: "Electronics", location: "Library", color: "Black" }
);

// 3. Main Library Entrance vs Library → partial, not perfect location score
runTest("Main Library Entrance vs Library", 
  { title: "Keys", category: "Accessories", location: "Main Library Entrance" },
  { title: "Keys", category: "Accessories", location: "Library" }
);

// 4. Apple laptop charger vs charger → high but not perfect title similarity
runTest("Apple laptop charger vs charger", 
  { title: "Apple laptop charger", category: "Electronics", location: "Dorm" },
  { title: "charger", category: "Electronics", location: "Dorm" }
);

// 5. Missing description and color → still match based on available information
runTest("Missing description and color", 
  { title: "Math Textbook", category: "Books", location: "Room 101" }, // missing color/desc
  { title: "Math Textbook", category: "Books", location: "Room 101", color: "Blue" }
);

// 6. Found before lost → date contributes 0
runTest("Found before lost", 
  { title: "Wallet", category: "Accessories", location: "Gym", eventDate: new Date("2026-08-25T00:00:00Z") },
  { title: "Wallet", category: "Accessories", location: "Gym", eventDate: new Date("2026-08-22T00:00:00Z") }
);

// 7. Same-type reports → null
runTest("Same-type reports", 
  { type: "LOST", title: "Phone", category: "Electronics", location: "Quad" },
  { type: "LOST", title: "Phone", category: "Electronics", location: "Quad" }
);

// 8. Wrong argument order → null
runTest("Wrong argument order", 
  { type: "FOUND", title: "Phone", category: "Electronics", location: "Quad" },
  { type: "LOST", title: "Phone", category: "Electronics", location: "Quad" }
);
