import dotenv from "dotenv";    
dotenv.config();

export default function errorMiddleware (err, req, res, next){
  // TODO: When prod ready do this:
  // const isDevelopment = process.env.NODE_ENV === 'development';
  const isDevelopment = true;
  
  res.status(err.status || 500).json({
    success: false,
    message: "Something went wrong",
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack }) 
  });
};
