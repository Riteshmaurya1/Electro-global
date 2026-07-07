# Car Details Finder 🚗

A natural-language car search engine. Users type a query like *"Suggest a family SUV under 15 lakhs with good mileage"* and get back a clean list of matching cars — no dropdowns, no filters to click through.

Live demo backend: `https://electro-global.onrender.com/api/cars`

---

## How it works

1. User types a free-text query in the search box.
2. The query is parsed into structured filters — either by a **basic keyword/regex parser** or by **Gemini (LLM)**, depending on config.
3. The filters are converted into a MongoDB query.
4. Up to 10 matching cars are returned, sorted by popularity, price, or mileage.
5. The frontend renders them as a grid of cards.

```
User query
   │
   ▼
queryParserBasic.js  OR  queryParserLLM.js (Gemini)
   │
   ▼
carController.js  →  builds MongoDB query
   │
   ▼
MongoDB (Car collection, seeded from CSV)
   │
   ▼
JSON response  →  frontend renders car cards
```

---

## Tech Stack

| Layer      | Tech                                  |
|------------|----------------------------------------|
| Backend    | Node.js, Express                      |
| Database   | MongoDB + Mongoose                    |
| NLP/Parsing| Custom regex parser **or** Gemini (`@google/generative-ai`) |
| Frontend   | Vanilla JS + Axios                    |
| Data       | Seeded from `Vehicle_Models_India_15k.csv` |
| Hosting    | Render (backend)                      |

---

## Project Structure

```
backend/
├── controllers/
│   └── carController.js       # main search logic + Mongo query building
├── models/
│   └── Car.js                 # Mongoose schema
├── services/
│   ├── queryParserBasic.js    # regex-based filter extraction
│   └── queryParserLLM.js      # Gemini-based filter extraction
├── scripts/
│   └── seedCars.js            # CSV → MongoDB seeder
├── utils/
│   ├── AppError.js
│   └── catchAsync.js
└── data/
    └── Vehicle_Models_India_15k.csv

frontend/
├── index.html
├── style.css
└── app.js                     # search, render results, render filter badges
```

---

## Data Model (`Car`)

| Field           | Type      | Notes                                             |
|-----------------|-----------|----------------------------------------------------|
| `brand`         | String    |                                                    |
| `model`         | String    |                                                    |
| `launchYear`    | Number    |                                                    |
| `segment`       | String    | e.g. SUV, Sedan, Hatchback, Compact SUV, MPV      |
| `fuelType`      | String    | Petrol, Diesel, Electric, CNG, Petrol/CNG         |
| `variants`      | Number    | count of variants available                       |
| `priceMin`      | Number    | starting ex-showroom price, in ₹ Lakhs            |
| `priceMax`      | Number    | top variant ex-showroom price, in ₹ Lakhs         |
| `monthlySales`  | Number    | used as the default popularity sort                |
| `isEV`          | Boolean   |                                                    |
| `mileage`       | Number    | kmpl — `null` for EVs                             |
| `batteryInfo`   | String    | raw battery/range string — only set for EVs        |
| `features`      | [String]  | parsed from the CSV's "Notable Features" column   |

> **Note on price:** `priceMin`/`priceMax` come from a single CSV column like `"6.00 - 15.00"`. The search filter matches on `priceMin` (a car's *starting* price) against the user's budget, since a car whose base variant fits the budget should be shown even if a fully-loaded top variant costs more. The frontend displays only `priceMin` ("Starting ₹X Lakhs") to avoid confusing range displays.

---

## Setup

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Environment variables
Create a `.env` file in the project root:
```env
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
USE_LLM=false          # true = use Gemini for parsing, false = use regex parser
PORT=5000
```

### 3. Seed the database
Place the CSV at `data/Vehicle_Models_India_15k.csv`, then run:
```bash
node backend/scripts/seedCars.js
```
This drops the existing `cars` collection and reloads it from the CSV, parsing:
- the price range string into `priceMin` / `priceMax`
- the mileage/battery string into `mileage` (number) or `batteryInfo` (string, EVs only)
- the comma-separated features string into a `features` array

Rows with an unparseable price range are skipped and logged with a warning.

### 4. Run the server
```bash
npm start
```

### 5. Open the frontend
Open `frontend/index.html` in a browser (or serve it statically), and make sure `API_URL` in `app.js` points to your running backend.

---

## API

### `POST /api/cars/search`

**Request body:**
```json
{ "query": "Suggest a family SUV under 15 lakhs with good mileage" }
```

**Response:**
```json
{
  "useLLM": false,
  "parsedFilters": {
    "budgetMax": 15,
    "segment": "suv",
    "sortBy": "mileage"
  },
  "cars": [ /* up to 10 matching car documents */ ],
  "total": 10
}
```

If nothing matches:
```json
{
  "useLLM": false,
  "parsedFilters": { "...": "..." },
  "cars": [],
  "total": 0,
  "message": "No cars matched your query. Try being less specific."
}
```

No pagination — results are capped at 10 cars per query, sorted by relevance.

**Supported filters (parsed from natural language):**
| Filter        | Example phrase in query           |
|---------------|-------------------------------------|
| `budgetMax`   | "under 15 lakhs", "below 10L"       |
| `fuelType`    | "diesel", "petrol", "electric/ev", "cng" |
| `segment`     | "suv", "sedan", "hatchback", "mpv"  |
| `minSeating`  | "7-seater", "7 seater"              |
| `sortBy`      | "mileage" / "long trips" → mileage; "cheap" / "budget" → price; default → popularity |

---

## Query Parsing: Basic vs LLM

- **Basic parser** (`queryParserBasic.js`): fast, free, regex/keyword matching. Good for common phrasings, but misses nuance (synonyms, compound requests).
- **LLM parser** (`queryParserLLM.js`): uses Gemini (`gemini-2.5-flash`, `temperature: 0` for consistency) to extract structured filters as JSON. Handles more natural phrasing, but requires an API key and has latency/cost.

Toggle between them with the `USE_LLM` environment variable.

---

## Known Data Caveats

The seeded dataset is synthetic/generated, so a few quirks are worth knowing:

- **Price buckets by segment, not by car.** Every car in a given segment tends to share the same `priceMin`–`priceMax` range (e.g. all "SUV" rows are `10–30`, all "Compact SUV" rows are `18–7`). This means budget filtering is only as precise as the dataset — don't expect real-world per-model pricing granularity.
- **Occasional segment/fuel mismatches**, e.g. a row with `segment: "Electric Hatchback"` but `fuelType: "Petrol"`. The seed script logs a warning for these but does not auto-correct them.
- **No image URLs** are present in the current dataset — the frontend has a placeholder hook for `car.image` if that field is added later.

---

## Roadmap / Possible Improvements

- Real per-model pricing instead of segment-level buckets
- Car images (uploaded or fetched from a public dataset)
- Better fuzzy brand/model matching in the basic parser
- Caching for repeated Gemini queries to reduce API cost
- Unit tests for both parsers and the query-building logic in `carController.js`
