import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./Routes/authRoutes.js";
import partnershipRoutes from "./Routes/partnershipRoutes.js";
import userRoutes from "./Routes/usersRoutes.js";
import adminRoutes from "./Routes/adminRoutes.js";
import superAdminRoutes from "./Routes/superAdminRoutes.js";
import notificationRoutes from "./Routes/notificationRoutes.js";
import db_connection from "../database/db_connection.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerDocument = YAML.load(path.join(__dirname, "../swagger.yaml"));

const app = express();
const PORT = process.env.PORT || 7004;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);


// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/partnership", partnershipRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/notifications", notificationRoutes);

// DB + Server
const startServer = async () => {
  try {
    await db_connection();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();