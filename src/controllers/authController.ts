import controllerWrapper from "../middleware/controllerWrapper";
import * as authService from "../services/authService";

export const addTwo = controllerWrapper(async (req, res, next) => {
  try {
    const a = req.body.a;
    const b = req.body.b;
    const result = authService.addFunc(a, b);
    return res.success("add_two", result, 200);
  } catch (error) {
    return res.error("add_two_failed", error.message, 500);
  }
});

