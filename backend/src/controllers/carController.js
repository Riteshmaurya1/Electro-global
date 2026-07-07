import Car from "../models/Car.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";
import { parseQueryBasic } from "../services/queryParserBasic.js";
import { parseQueryLLM } from "../services/queryParserLLM.js";

const USE_LLM = process.env.USE_LLM === "true";

export const searchCars = catchAsync(async (req, res, next) => {
  const { query } = req.body;
  if (!query) {
    return next(new AppError("Query is required", 400));
  }

  let filters = USE_LLM ? await parseQueryLLM(query) : parseQueryBasic(query);
  console.log("Parsed filters:", filters);

  const mongoQuery = {};

  if (filters.brand) {
    mongoQuery.brand = new RegExp(filters.brand, "i");
  }

  if (filters.fuelType) {
    mongoQuery.fuelType = new RegExp(filters.fuelType, "i");
  }

  if (filters.minSeating >= 7 && !filters.segment) {
    mongoQuery.segment = { $in: [/SUV/i, /MPV/i] };
  } else if (filters.segment) {
    mongoQuery.segment = new RegExp(filters.segment, "i");
  }

  if (filters.budgetMax) {
    mongoQuery.priceMin = { $lte: Number(filters.budgetMax) };
  }

  let sortOption = { monthlySales: -1 };
  if (filters.sortBy === "price") sortOption = { priceMin: 1 };
  if (filters.sortBy === "mileage") sortOption = { mileage: -1 };

  console.log(
    "Mongo query:",
    JSON.stringify(mongoQuery),
    "| Sort:",
    sortOption,
  );

  // fixed set of 10 results, no pagination
  const cars = await Car.find(mongoQuery).sort(sortOption).limit(10);

  if (!cars.length) {
    return res.status(200).json({
      useLLM: USE_LLM,
      parsedFilters: filters,
      mongoQuery,
      cars: [],
      total: 0,
      message: "No cars matched your query. Try being less specific.",
    });
  }

  res.status(200).json({
    useLLM: USE_LLM,
    parsedFilters: filters,
    cars,
    total: cars.length,
  });
});
