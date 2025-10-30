import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const verifyRefreshToken = (req, res, next) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No refresh token provided.",
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET_KEY!);

    req.user = decoded;
    next();
  } catch (error) {
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth/refresh-token'
    });

    return res.status(401).json({
      success: false,
      message: "invalid_refresh_token",
    });
  }
};
