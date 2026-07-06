// backend/scripts/seedCars.js
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

const connectAndSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected for seeding");

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (row) => {
        const priceRange = row["Ex-Showroom Price (₹ Lakhs)"];
        const [minPrice, maxPrice] = priceRange
          .split("-")
          .map((p) => parseFloat(p.trim()));

        const features = row["Notable Features"]
          ? row["Notable Features"].split(",").map((f) => f.trim())
          : [];

        cars.push({
          brand: row["Brand"],
          model: row["Model"],
          launchYear: Number(row["Launch Year"]),
          segment: row["Segment"],
          fuelType: row["Fuel Type"],
          variants: Number(row["Variants"]),
          priceMin: minPrice,
          priceMax: maxPrice,
          monthlySales: Number(row["Monthly Sales (Units)"]),
          isEV: row["Is EV?"] === "Yes",
          mileage: row["Battery / Mileage"],
          notableFeatures: features,
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