import express from "express";
import cors from "cors";
import { connectDB } from "./DB/Database.js";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import transactionRoutes from "./Routers/Transactions.js";
import userRoutes from "./Routers/userRouter.js";
import aiInsightsRoutes from "./Routers/aiInsights.js";

// Load local environment files if present
dotenv.config({ path: "./config/secrets.env" });
dotenv.config({ path: "./config/config.env" });
dotenv.config();

const app = express();

// CORS configuration: allow exact configured frontend origin(s) and local development
const parseAllowedOrigins = () => {
  const origins = new Set(["http://localhost:3000", "http://localhost:5173"]);
  if (process.env.FRONTEND_URL) {
    process.env.FRONTEND_URL.split(",").forEach((url) => {
      const trimmed = url.trim().replace(/\/+$/, "");
      if (trimmed) {
        origins.add(trimmed);
      }
    });
  }
  return origins;
};

const isOriginAllowed = (origin) => {
  // Allow requests without origin (such as server-to-server or curl)
  if (!origin) return true;

  const allowedOrigins = parseAllowedOrigins();
  const normalizedOrigin = origin.trim().replace(/\/+$/, "");

  if (allowedOrigins.has(normalizedOrigin)) return true;

  // In non-production environments, permit local dev origins
  if (process.env.NODE_ENV !== "production") return true;

  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Wait for active DB connection before handling database-backed API requests
app.use(async (req, res, next) => {
  if (req.path === "/" || req.path === "/health") {
    return next();
  }

  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database connection failure on request:", err.message);
    return res.status(503).json({
      success: false,
      message: "Database connection failed. Please check MONGO_URL and database access.",
    });
  }
});

// Routers
app.use("/api/v1", transactionRoutes);
app.use("/api/v1/ai", aiInsightsRoutes);
app.use("/api/auth", userRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    name: "PennyBloom API",
    status: "online",
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// Start listening only in standalone local mode, not in Vercel serverless or unit tests
const isVercel = Boolean(process.env.VERCEL);
const port = process.env.PORT || 5000;

if (!isVercel && process.env.NODE_ENV !== "test") {
  (async () => {
    try {
      await connectDB();
      app.listen(port, () => {
        console.log(`Server is listening on http://localhost:${port}`);
      });
    } catch (err) {
      console.error(
        "Failed to start server - MongoDB connection error. Check MONGO_URL and database network access.",
        err
      );
      process.exit(1);
    }
  })();
}

export default app;
