# Lost & Found Matcher

**Live Demo:** [https://lostandfound-gamma-six.vercel.app/](https://lostandfound-gamma-six.vercel.app/)

A small university lost-and-found application that helps identify potential matches between lost and found item reports.

The application allows users to submit lost and found reports with optional image uploads, browse existing reports, and view automatically calculated potential matches with side-by-side visual comparisons.

The focus of this project is the matching logic: making reasonable, explainable decisions from incomplete and inconsistent human input, augmented by human visual verification, without relying on AI APIs or heavy background processing.

## Features

- **Smart Matching Engine**: A deterministic scoring algorithm that compares item titles, descriptions, categories, locations, dates, and colors.
- **Side-by-Side Visual Comparison**: Users can upload optional images via Cloudinary to visually compare potential matches side-by-side.
- **Direct Communication**: Context-aware "Contact Finder" / "Contact Owner" email integration.
- **Dynamic Scoring**: Fairly scores reports even when optional fields are missing.
- **Title Identity Safeguard**: Prevents false positives by ensuring core item identities match (e.g., stopping a "black laptop" from matching a "black backpack").
- **Conservative Synonym Mapping**: Normalizes common terms (e.g., `airpods` → `earbuds`) to improve matching without over-generalizing.

## Tech Stack

- **Frontend**: Next.js (App Router), React, Tailwind CSS, TypeScript
- **Backend**: Next.js Route Handlers
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod
- **Image Storage**: Cloudinary (Unsigned Uploads)

---

## Overview

A lost item report and a found item report may describe the same object differently.

For example:

> **Lost:** Black AirPods case near the cafeteria.

and:

> **Found:** Dark wireless earbud case near the coffee shop.

A simple exact string comparison would fail to identify this as a possible match.

This application uses a deterministic scoring algorithm that compares multiple signals:

- item identity from the title,
- description details,
- category,
- location,
- date proximity,
- and color.

The result is presented as either a **Strong Match** or **Possible Match**, along with an explanation of why the reports matched.

---

# Architecture

The application uses a small full-stack architecture built around Next.js.

```text
                    ┌──────────────────┐
                    │     Next.js UI    │
                    │                  │
                    │  Report Form     │
                    │  Report Feed     │
                    │  Match Results   │
                    └────────┬─────────┘
                             │
                             │ HTTP Requests
                             ▼
                    ┌──────────────────┐
                    │   API Routes      │
                    │                  │
                    │ Input Validation │
                    │ Report Queries   │
                    │ Match Requests   │
                    └───────┬─────┬────┘
                            │     │
                 Prisma     │     │ Match candidates
                            │     ▼
                            │  ┌──────────────────┐
                            │  │ Matching Engine  │
                            │  │                  │
                            │  │ Pure TypeScript  │
                            │  │ Weighted Scoring │
                            │  └──────────────────┘
                            ▼
                    ┌──────────────────┐
                    │ PostgreSQL        │
                    │                  │
                    │      Report       │
                    └──────────────────┘
```

The architecture intentionally separates **data access**, **HTTP handling**, and **matching logic**.

### Frontend

The Next.js frontend is responsible for:

- displaying recent lost and found reports,
- allowing users to submit new reports,
- validating input for immediate user feedback,
- displaying report details,
- and presenting potential matches and the reasons behind them.

The UI does not contain matching logic. It requests matches from the API and displays the results.

---

### API Layer

Next.js Route Handlers provide a small API layer between the UI and database.

The API is responsible for:

1. validating incoming data using Zod,
2. converting event dates into a consistent format,
3. reading and writing reports through Prisma,
4. retrieving candidate reports,
5. passing candidates into the matching engine,
6. sorting and returning the strongest matches.

The main endpoints are:

| Endpoint                        | Purpose                                                 |
| ------------------------------- | ------------------------------------------------------- |
| `POST /api/reports`             | Create a lost or found report                           |
| `GET /api/reports`              | Retrieve recent reports                                 |
| `GET /api/reports/[id]`         | Retrieve one report                                     |
| `GET /api/reports/[id]/matches` | Calculate potential matches                             |
| `GET /api/suggestions`          | Retrieve commonly used categories, locations, or colors |

---

### Matching Engine

The matching engine is isolated in:

```text
src/lib/matching.ts
```

It is a pure TypeScript module and does not depend on:

- Next.js,
- Prisma,
- PostgreSQL,
- HTTP,
- or external APIs.

Its core function is conceptually:

```ts
calculateMatch(lostReport, foundReport)
```

It receives one lost report and one found report and returns either:

```ts
{
  score: 85,
  strength: "STRONG",
  reasons: [
    "Item titles strongly match.",
    "Locations are closely related.",
    "Events occurred within a few days of each other."
  ],
  breakdown: {
    title: 22,
    description: 10,
    category: 15,
    location: 16,
    date: 12,
    color: 10
  }
}
```

or:

```ts
null
```

if the reports should not be considered a potential match.

Keeping this logic isolated makes it easier to:

- test independently,
- reason about,
- modify the scoring rules,
- and explain why a match was produced.

---

# Database Design

The application uses PostgreSQL with Prisma.

Instead of creating separate tables for categories, locations, or colors, the MVP uses a single `Report` table.

Conceptually:

```text
Report
────────────────────────────
id
type
title
category
description
color
location
eventDate
createdAt
```

### Why a single table?

Lost and found reports represent the same type of entity: an item report.

The main difference is whether the item was:

```text
LOST
```

or:

```text
FOUND
```

This is represented using the `type` field.

This design makes matching straightforward:

```text
Lost Report
     │
     ▼
Find all FOUND reports
     │
     ▼
Run each candidate through
the matching engine
     │
     ▼
Return the highest scoring matches
```

The reverse happens when viewing a found report:

```text
Found Report
     │
     ▼
Find all LOST reports
     │
     ▼
Run each candidate through
the matching engine
```

### Why are category, location, and color strings?

These fields are intentionally not strict enums.

A university can have a large variety of items:

- AirPods
- calculators
- laboratory equipment
- sports equipment
- wallets
- ID cards
- bags
- chargers

Restricting users to a fixed list would eventually force valid items into an `"Other"` category, which would reduce the quality of matching.

Instead, users can enter custom values.

The UI can suggest values that have previously been used in reports, while still allowing completely new values.

This provides flexibility without requiring additional lookup tables for the MVP.

---

# Matching Design

The matching algorithm uses a weighted score.

The maximum score is:

```text
100 points
```

The signals are weighted as follows:

| Signal      | Maximum Points | Purpose                     |
| ----------- | -------------: | --------------------------- |
| Title       |             25 | Primary item identity       |
| Description |             15 | Additional item details     |
| Category    |             15 | General item classification |
| Location    |             20 | Physical proximity          |
| Date        |             15 | Temporal proximity          |
| Color       |             10 | Visual similarity           |

However, before calculating the final score, the reports must pass an important relevance check.

---

## Step 1: Title Identity Safeguard

The title is treated as the strongest indication of what the item actually is.

Before scoring metadata such as location or date, the algorithm checks whether the titles share a meaningful item identity word.

For example:

```text
Lost:  Black laptop
Found: Black backpack
```

Both reports share:

```text
black
```

However, `black` is only a descriptive attribute, not item identity.

The algorithm excludes descriptive words such as:

```text
black
white
red
blue
dark
light
small
large
new
old
leather
plastic
metal
```

Because the meaningful words are:

```text
laptop
backpack
```

there is no identity overlap.

The result is:

```text
null
```

This prevents a false positive where unrelated items receive a high score simply because they were lost in the same location on the same day.

---

## Step 2: Normalize the Text

Human descriptions are inconsistent.

The algorithm normalizes text by:

1. converting text to lowercase,
2. removing punctuation,
3. splitting text into words,
4. removing common stop words,
5. applying a small synonym map.

For example:

```text
AirPods
```

can be normalized to:

```text
earbuds
```

and:

```text
transcript
```

can be normalized to:

```text
document
```

and:

```text
backpack
```

can be normalized to:

```text
bag
```

This helps identify vocabulary differences without introducing a complex NLP or AI dependency.

The synonym list is intentionally conservative.

For example, the application does **not** automatically treat:

```text
headphones
```

and:

```text
earbuds
```

as identical items because they may represent different objects.

---

## Step 3: Calculate Text Similarity

The application does not use exact matching alone.

Consider:

```text
Lost:  charger
Found: Apple laptop charger
```

The reports clearly share an item identity, but they are not identical strings.

A naive overlap algorithm could incorrectly give this comparison a perfect score because every word in the shorter title appears in the longer title.

To avoid that, the matching engine combines:

- an overlap-based similarity,
- and Jaccard similarity.

This produces a balanced result:

```text
Exact match
        ↓
High similarity

Partial containment
        ↓
Strong but not perfect similarity

No shared meaningful words
        ↓
No match
```

For example:

```text
"Main Library Entrance"
```

and:

```text
"Library"
```

receive a high location similarity because they overlap, but not a perfect score.

---

## Step 4: Compare Additional Signals

After the identity safeguard passes, the application compares the remaining information.

### Description

Descriptions provide additional context.

For example:

```text
Lost:
Black backpack containing a laptop charger

Found:
Dark backpack with a charger inside
```

Shared details can increase confidence.

Because descriptions are optional, missing descriptions do not automatically penalize a report.

---

### Category

Categories provide a general classification of the item.

For example:

```text
Electronics
```

and:

```text
Electronics
```

receive a strong score.

Partial similarity can also contribute when categories contain multiple words.

---

### Location

Locations are compared using the same lightweight text similarity approach.

For example:

```text
Library
```

and:

```text
Main Library Entrance
```

can partially match.

An exact location match receives the highest location contribution.

---

### Date Proximity

The event date represents the day an item was lost or found.

The algorithm compares dates using UTC calendar days.

The scoring is:

| Difference        | Points |
| ----------------- | -----: |
| Same day          |     15 |
| 1–2 days          |     12 |
| 3–7 days          |      8 |
| 8–14 days         |      3 |
| More than 14 days |      0 |
| Found before lost |      0 |

A found report occurring before the lost report is not automatically rejected because users may enter approximate or incorrect dates, but it receives no temporal score.

---

### Color

Color provides an additional visual signal.

An exact match receives:

```text
10 points
```

Related shades can receive a partial score.

For example:

```text
blue ↔ navy
```

may receive partial credit.

However, the algorithm deliberately does not treat:

```text
dark
```

as:

```text
black
```

because "dark" is too vague to reliably represent a specific color.

---

# Dynamic Scoring for Missing Information

Descriptions and colors are optional.

Consider two reports with no color information.

It would be unfair to calculate the result as if both reports failed the color comparison.

Instead, unavailable signals are removed from the maximum possible score.

For example:

```text
Available signals:

Title       25
Description 15
Category    15
Location    20
Date        15

Color unavailable

Maximum possible score = 90
```

If the reports earn:

```text
72 points
```

the final score becomes:

```text
72 / 90 × 100 = 80%
```

This means the percentage represents the strength of the match based on the information that is actually available.

---

# Match Classification

After scoring:

```text
80–100%  → Strong Match
60–79%   → Possible Match
Below 60 → Not shown
```

Returning only stronger candidates prevents users from being overwhelmed by weak or coincidental matches.

---

# How Matches Are Calculated

Matches are calculated **on demand**.

They are not stored in the database.

When a user opens a report:

```text
User opens Report
        │
        ▼
GET /api/reports/[id]/matches
        │
        ▼
Load target report
        │
        ▼
Query reports with the opposite type
        │
        ▼
Compare each candidate
        │
        ▼
Reject irrelevant candidates
        │
        ▼
Sort by match score
        │
        ▼
Return top 10
```

For this MVP, calculating matches on demand is simpler than introducing:

- background workers,
- queues,
- scheduled jobs,
- or a separate `Match` table.

For a small university dataset, this approach is reasonable and keeps the system focused on the assessment's core requirement.

A production system with a much larger number of reports could precompute matches or use more efficient candidate filtering.

---

# How to Run

## 1. Install dependencies

```bash
npm install
```

## 2. Configure the environment

Copy the example environment file:

```bash
cp .env.example .env
```

Set your PostgreSQL connection string and Cloudinary unsigned upload preset:

```env
DATABASE_URL="postgresql://..."

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="your_unsigned_preset"
```

## 3. Generate the Prisma client and create the database schema

```bash
npx prisma generate
npx prisma db push
```

## 4. Seed sample reports

```bash
npm run seed
```

The seed data includes examples designed to demonstrate:

- strong matches,
- possible matches,
- unrelated reports,
- false-positive prevention,
- and visual image comparisons.

## 5. Start the application

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# Assumptions

### Event Date

The event date represents a calendar day rather than an exact timestamp.

Dates are stored at UTC midnight and displayed using UTC formatting to avoid timezone-related date shifts.

### Report Data

Users may describe categories, colors, and locations differently.

The system uses lightweight normalization and similarity scoring rather than requiring exact predefined values.

### Matching

A match score represents a potential match, not proof that two reports describe the same physical item.

The final confirmation should still be made by a person, leveraging the side-by-side visual comparison functionality.

---

# Intentional Scope Limits

To keep the project focused on the core problem and appropriate for the assessment time constraint, I intentionally did not implement:

- authentication or user accounts,
- complex internal messaging systems (using simple `mailto:` instead),
- notifications,
- background workers or queues,
- AI/LLM-based matching,
- semantic/vector search,
- duplicate detection,
- or advanced geospatial location matching.

These features would add complexity without being necessary to demonstrate the core matching problem.

---

# Future Improvements

If this were developed into a larger product, I would consider:

- **Semantic search** using embeddings for more flexible descriptions.
- **Geospatial locations** instead of plain text building names.
- **In-App Messaging/Chat**, allowing the person who lost the item and the finder to communicate securely within the app without immediately sharing personal email addresses.
- **Notifications** when a newly submitted report creates a strong match.
- **Deduplication and rate limiting** to reduce spam.
- **Candidate pre-filtering** and background match calculation as the number of reports grows.
- **Feedback loops**, allowing users to confirm or reject suggested matches and improve future ranking.

---

# AI Usage

I used AI tools as part of my development workflow to explore architecture options, review the matching algorithm, identify edge cases, and accelerate implementation.

I specifically used AI to help challenge and refine decisions around false positives, text similarity, missing information, timezone handling, validation, and API design.

I reviewed and modified the generated suggestions and chose a deterministic matching approach because it is easier to test, explain, and reason about within the scope of this assessment.
