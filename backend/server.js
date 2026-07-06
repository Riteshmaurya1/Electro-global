import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "../backend/src/config/db.js";
import carRoutes from "../backend/src/routes/carRoutes.js";
import errorHandler from "../backend/src/middleware/errorHandler.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/cars", carRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to the Electro Global API");
});

// Global error handler (last)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
