# Car Finder — Natural Language Car Search Platform

A full-stack web application that lets users search a dataset of 15,000+ Indian car models using plain English queries like "Suggest a family SUV under 15 lakhs with good mileage". The backend parses the query (via keyword matching or Google Gemini LLM), filters/ranks cars from MongoDB, and the frontend displays the results in a clean card grid.

---

## Tech Stack

- Backend: Node.js, Express.js (ES Modules)
- Database: MongoDB (Mongoose ODM)
- NLP / Query Parsing: Keyword-based parser (default) + optional Google Gemini API (gemini-2.5-flash) for smarter extraction
- Frontend: Vanilla HTML, CSS, JavaScript (Axios for API calls)
- Deployment: Backend on Render, Frontend on Vercel

---

## Folder Structure

Electro-global/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                # MongoDB connection
│   │   ├── models/
│   │   │   └── Car.js                # Car schema
│   │   ├── controllers/
│   │   │   └── carController.js      # Search logic
│   │   ├── routes/
│   │   │   └── carRoutes.js          # /api/cars routes
│   │   ├── services/
│   │   │   ├── queryParserBasic.js   # Keyword-based parser
│   │   │   └── queryParserLLM.js     # Gemini-based parser
│   │   ├── middleware/
│   │   │   └── errorHandler.js       # Global error handler
│   │   ├── utils/
│   │   │   ├── AppError.js
│   │   │   └── catchAsync.js
│   │   └── scripts/
│   │       └── seedCars.js           # CSV → MongoDB seeding script
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── data/
│   └── Vehicle_Models_India_15k.csv
└── README.md

---

## Setup Instructions

### 1. Clone the repository

git clone https://github.com/Riteshmaurya1/Electro-global.git
cd Electro-global

### 2. Backend setup

cd backend
npm install

Create a .env file inside backend/:

MONGO_URI=your_mongodb_atlas_connection_string
PORT=3000
USE_LLM=false
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=development

### 3. Seed the database (one-time)

Place Vehicle_Models_India_15k.csv inside the data/ folder, then run:

node src/scripts/seedCars.js

This loads all 15,000+ car records into MongoDB.

### 4. Start the backend server

npm start

Server runs at http://localhost:3000.

### 5. Frontend setup

Open frontend/app.js and set the backend URL:

const API_URL = "http://localhost:3000/api/cars";

Then simply open frontend/index.html in a browser, or serve it via any static server.

---

## API Reference

### POST /api/cars/search

Request body:

{
  "query": "Suggest a family SUV under 15 lakhs with good mileage"
}

Response:

{
  "useLLM": true,
  "parsedFilters": {
    "budgetMax": 15,
    "fuelType": null,
    "segment": "SUV",
    "transmission": null,
    "minSeating": null,
    "brand": null,
    "sortBy": "mileage"
  },
  "cars": [ { "brand": "...", "model": "...", "priceMin": 7, "priceMax": 18 } ],
  "total": 8
}

### GET /api/cars/health

Returns { "status": "OK" } to confirm the server is running.

---

## My Approach

1. Data handling: The CSV (brand, model, price range, fuel type, segment, mileage, features) is seeded into a MongoDB cars collection using a one-time script, converting the price range string (e.g. "7.00 - 18.00") into priceMin/priceMax numeric fields for querying.

2. Query parsing: A natural language query is parsed in one of two ways, controlled by a USE_LLM env flag:
   - Basic mode (default): Regex/keyword matching extracts budget, fuel type, body type, seating, and transmission hints.
   - LLM mode: The query is sent to Google Gemini with a structured prompt, returning a clean JSON object of filters (budget, fuel type, segment, seating, brand, sort preference).

3. Filtering & ranking: Extracted filters are converted into a MongoDB query (regex for fuel/segment/brand, range filters for budget, $in for seating-based segment matches). Results are sorted by monthly sales (popularity), price, or implied mileage preference, and capped at 10 results per the requirement.

4. Edge cases: Empty queries return a 400 error via a custom AppError class and global error-handling middleware. No-match queries return a friendly message with an empty array instead of a generic failure.

5. Frontend: A single-page vanilla JS app with a search bar, filter badges (showing what was parsed from the query), and a responsive card grid — no framework overhead needed for this scope.

---

## Deployment

- Backend (Render): https://electro-global.onrender.com/api/cars/search
- Frontend (Vercel): https://electro-global-frontend.vercel.app

---

## What I'd Improve With More Time

1. Replace keyword/LLM-JSON filtering with vector embeddings (Gemini text-embedding-004) for true semantic search on vague queries like "comfortable highway car".
2. Add Redis caching for repeated queries and rate limiting on the LLM endpoint to control API costs and latency.
3. Migrate the frontend to React for better state management, add car images, and include fuzzy brand/model matching for typos.
