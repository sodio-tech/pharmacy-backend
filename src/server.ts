import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import compression from "compression";
import responseMiddleware from "./middleware/response.js";
import errorMiddleware from "./middleware/errorHandler.js";
import cookieParser  from 'cookie-parser';

import authRoutes from "./routes/v1/authRoutes.js";
import userRoutes from "./routes/v1/userRoutes.js";
import pharmacyBranchRoutes from "./routes/v1/orgRoutes.js";
import supplierRoutes from "./routes/v1/supplierRoutes.js"; 
import productRoutes from "./routes/v1/productRoutes.js"
import orderRoutes from "./routes/v1/orderRoutes.js"
import inventoryRoutes from "./routes/v1/inventoryRoutes.js"
import salesRoutes from "./routes/v1/salesRoutes.js"
import customerRoutes from "./routes/v1/customerRoutes.js"

dotenv.config();

const app = express();
app.use(helmet());

const allowedOrigins = [
  "http://localhost:3000",
  "https://pharmy.sodio.tech"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

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
app.use("/api/v1/org", pharmacyBranchRoutes);
app.use("/api/v1/supplier", supplierRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/sales", salesRoutes);
app.use("/api/v1/customer", customerRoutes);

app.use(errorMiddleware);

const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

