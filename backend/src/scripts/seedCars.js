import fs from "fs";
import path from "path";
import csv from "csv-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Car from "../models/Car.js";
import { fileURLToPath } from "url";

dotenv.config(); // .env at project root, run from project root

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("MONGO_URI is:", process.env.MONGO_URI); // should NOT be undefined now

const csvPath = path.join(__dirname, "../../../data/Vehicle_Models_India_15k.csv");

const cars = [];

// "6.00 - 15.00" -> { min: 6, max: 15 }
function parsePriceRange(str) {
  if (!str) return { min: null, max: null };
  const parts = str.split("-").map((p) => parseFloat(p.trim()));
  return { min: parts[0] ?? null, max: parts[1] ?? null };
}

// isEV true  -> mileage: null, batteryInfo: raw string (e.g. "40 kWh / 400 km range")
// isEV false -> mileage: parsed number from "20.1 kmpl", batteryInfo: null
function parseMileageOrBattery(str, isEV) {
  if (!str) return { mileage: null, batteryInfo: null };
  if (isEV) return { mileage: null, batteryInfo: str.trim() };
  const match = str.match(/([\d.]+)\s*kmpl/i);
  return { mileage: match ? parseFloat(match[1]) : null, batteryInfo: null };
}

const connectAndSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected for seeding");

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (row) => {
        const priceRange = row["Ex-Showroom Price (₹ Lakhs)"];
        const { min: minPrice, max: maxPrice } = parsePriceRange(priceRange);

        const fuelType = row["Fuel Type"]?.trim() || "";
        const isEV =
          row["Is EV?"]?.trim().toLowerCase() === "yes" ||
          fuelType.toLowerCase() === "electric";

        const { mileage, batteryInfo } = parseMileageOrBattery(
          row["Battery / Mileage"],
          isEV,
        );

        const features = row["Notable Features"]
          ? row["Notable Features"].split(",").map((f) => f.trim())
          : [];

        // skip rows where price didn't parse — avoids silent bad data in DB
        if (minPrice == null || maxPrice == null) {
          console.warn(
            `⚠️ Skipping row (bad price range): ${row["Brand"]} ${row["Model"]} -> "${priceRange}"`,
          );
          return;
        }

        cars.push({
          brand: row["Brand"]?.trim(),
          model: row["Model"]?.trim(),
          launchYear: Number(row["Launch Year"]) || null,
          segment: row["Segment"]?.trim(),
          fuelType,
          variants: Number(row["Variants"]) || 0,
          priceMin: minPrice,
          priceMax: maxPrice,
          monthlySales: Number(row["Monthly Sales (Units)"]) || 0,
          isEV,
          mileage,
          batteryInfo,
          features,
        });
      })
      .on("end", async () => {
        try {
          await Car.deleteMany({});
          await Car.insertMany(cars);
          console.log(`✅ Seeded ${cars.length} cars`);
        } catch (err) {
          console.error("Seeding error:", err.message);
        } finally {
          await mongoose.disconnect();
          console.log("🔌 MongoDB disconnected");
        }
      });
  } catch (err) {
    console.error("MongoDB connection error (seeding):", err.message);
    process.exit(1);
  }
};

connectAndSeed();