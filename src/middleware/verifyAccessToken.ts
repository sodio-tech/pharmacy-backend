import jwt from "jsonwebtoken";
import {JwtPayload} from "jsonwebtoken"
import dotenv from "dotenv";
dotenv.config();

export const verifyAccessToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Split 'Bearer <token>'
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Invalid token format.",
      });
    }

    // Verify the token
    const decoded: any = jwt.verify(token, process.env.JWT_ACCESS_SECRET_KEY!);
    if (decoded.verified !== undefined && !decoded.verified) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Account is not verified.",
      });
    }

    // Add decoded user data to request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "access_token_expired_or_invalid",
    });
  }
};

