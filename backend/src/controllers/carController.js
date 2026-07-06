import Car from "../models/Car.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";
import { parseQueryBasic } from "../services/queryParserBasic.js";
import { parseQueryLLM } from "../services/queryParserLLM.js";

// ...imports...

const USE_LLM = process.env.USE_LLM === "true";

export const searchCars = catchAsync(async (req, res, next) => {
  const { query } = req.body;
  if (!query) {
    return next(new AppError("Query is required", 400));
  }

  // 1) Parse filters (LLM or basic)
  let filters;
  if (USE_LLM) {
    filters = await parseQueryLLM(query);
  } else {
    filters = parseQueryBasic(query);
  }

  const mongoQuery = {};

  if (filters.fuelType) mongoQuery.fuelType = filters.fuelType;
  if (filters.segment) mongoQuery.segment = filters.segment;
  if (filters.brand) mongoQuery.brand = new RegExp(filters.brand, "i");

  if (filters.budgetMax) mongoQuery.priceMin = { $lte: filters.budgetMax };
  if (filters.minSeating >= 7) {
    mongoQuery.segment = { $in: [/SUV/i, /MPV/i] };
  }

  // 2) Pagination params
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit; // standard offset-based pagination [web:84][web:86][web:88][web:94]

  // 3) Sort strategy
  let sortOption = { monthlySales: -1 };
  if (filters.sortBy === "price") sortOption = { priceMin: 1 };
  if (filters.sortBy === "mileage") sortOption = { monthlySales: -1 };

  // 4) Get page of data + total count
  const [cars, total] = await Promise.all([
    Car.find(mongoQuery).sort(sortOption).skip(skip).limit(limit),
    Car.countDocuments(mongoQuery),
  ]); // counting + paginating same query is a common REST pattern [web:84][web:88][web:94]

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  if (!cars.length) {
    return res.status(200).json({
      useLLM: USE_LLM,
      parsedFilters: filters,
      cars: [],
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
      message: "No cars matched your query. Try being less specific.",
    });
  }

  res.status(200).json({
    useLLM: USE_LLM,
    parsedFilters: filters,
    cars,
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
  });
});
