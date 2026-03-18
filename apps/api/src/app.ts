import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { apiRateLimit } from "./middleware/rateLimit";
import { errorHandler } from "./middleware/errorHandler";
import routes from "./routes/index";

const app = express();

// Security middleware
app.use(helmet());

// CORS
const corsOrigin = process.env["CORS_ORIGIN"] ?? "http://localhost:3000";
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  }),
);

// Logging
if (process.env["NODE_ENV"] !== "test") {
  app.use(morgan("combined"));
}

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
app.use("/api", apiRateLimit);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api", routes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
