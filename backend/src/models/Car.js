import mongoose from "mongoose";

const carSchema = new mongoose.Schema(
  {
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    launchYear: { type: Number },
    segment: { type: String, trim: true }, // e.g. Sedan, SUV, Hatchback, MPV, Compact SUV
    fuelType: { type: String, trim: true }, // Petrol, Diesel, Electric, CNG, Petrol/CNG
    variantsCount: { type: Number },

    // Parsed from "Ex-Showroom Price (₹ Lakhs)" e.g. "6.00 - 15.00"
    priceMin: { type: Number, required: true },
    priceMax: { type: Number, required: true },

    monthlySales: { type: Number, default: 0 },
    isEV: { type: Boolean, default: false },

    // Parsed from "Battery / Mileage"
    mileage: { type: Number }, // in kmpl, null if EV
    batteryInfo: { type: String }, // raw string, only meaningful if isEV

    features: [{ type: String }],
  },
  { timestamps: true },
);

export default mongoose.model("Car", carSchema);
