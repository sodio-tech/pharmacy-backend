/**
 * This middleware adds success and error response methods to the response object
 * Success response format: { success: true, message: string, data: any }
 * Error response format: { success: false, message: string, errors: any }
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */

export default function responseMiddleware (req, res, next)  {
  //Data is the data to be sent in the response
  res.success = (message, data = {}, statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  };

  res.error = (message, errors = {}, statusCode = 500) => {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  };

  next();
};

