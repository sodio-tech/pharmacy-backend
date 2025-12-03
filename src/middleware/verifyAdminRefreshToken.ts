import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const verifyAdminRefreshToken = (req, res, next) => {
  try {
    const refreshToken = res.cookies?.admin_refresh_token;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No admin refresh token provided.",
      });
    }
    
    const decoded: any = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET_KEY!
    );
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Refresh token verification error:", error);
    
    res.clearCookie('admin_refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: '.sodio.tech',
      path: '/',
    });
    
    return res.status(401).json({
      success: false,
      message: "refresh_token_expired_or_invalid",
    });
  }
};

