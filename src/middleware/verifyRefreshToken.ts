import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const verifyRefreshToken = (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refresh_token || res.cookies?.admin_refresh_token;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No refresh token provided.",
      });
    }
    
    const decoded: any = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET_KEY!
    );
    
    req.user = decoded;
    next();
  } catch (error) {
    const isAdmin = req.cookies?.admin_refresh_token;
    console.error("Refresh token verification error:", error);
    
    res.clearCookie(isAdmin ? 'admin_refresh_token' : 'refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      ...!isAdmin && {domain: '.one'},
      path: '/',
    });
    
    return res.status(401).json({
      success: false,
      message: "refresh_token_expired_or_invalid",
    });
  }
};
