
/**
 * Controller wrapper for error handling
 */
const controllerWrapper = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (err: any) {
    return res.error("internal_error", err.message);
  }
};

export default controllerWrapper;

