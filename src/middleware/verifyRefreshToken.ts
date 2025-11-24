import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const verifyRefreshToken = (req, res, next) => {
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
    const refreshToken = authHeader.split(" ")[1];
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Invalid token format.",
      });
    }

    // Verify the token
    const decoded: any = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET_KEY!);
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
    console.log(error);
    return res.status(401).json({
      success: false,
      message: "refresh_token_expired_or_invalid",
    });
  }
};


