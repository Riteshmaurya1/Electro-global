import mongoose from "mongoose";

const carSchema = new mongoose.Schema(
  {
    brand: String,
    model: String,
    launchYear: Number,
    segment: String,
    fuelType: String,
    variants: Number,
    priceMin: Number,
    priceMax: Number,
    monthlySales: Number,
    isEV: Boolean,
    mileage: String,
    notableFeatures: [String],
  },
  { timestamps: true },
);

carSchema.index({ segment: 1, fuelType: 1, priceMin: 1 });

const Car = mongoose.model("Car", carSchema);

export default Car;
