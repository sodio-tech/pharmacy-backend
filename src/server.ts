import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import compression from "compression";
import responseMiddleware from "./middleware/response.js";
import errorMiddleware from "./middleware/errorHandler.js";
import cookieParser from 'cookie-parser';

import authRoutes from "./routes/v1/authRoutes.js";
import userRoutes from "./routes/v1/userRoutes.js";

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(cookieParser());
app.set('trust proxy', 1);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 400,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  })
);
app.use(responseMiddleware);

// routes with versioning
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/", userRoutes);

app.use(errorMiddleware);

const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

