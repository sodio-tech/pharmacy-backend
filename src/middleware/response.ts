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
  //Key represent the message key in the language file
  //Data is the data to be sent in the response
  res.success = (key, data = {}, statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message: key,
      data,
    });
  };

  res.error = (key, errors = {}, statusCode = 500) => {
    return res.status(statusCode).json({
      success: false,
      message: key,
      errors,
    });
  };

  next();
};

