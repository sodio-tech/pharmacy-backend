import { getBranchesService } from "../services/orgService.js";

export const verifyBranchAccess = () => async (req, res, next) => {
  try {
    let branch_id = req.params?.branch_id || req.query?.branch_id || req.body?.branch_id;
    branch_id = Number(branch_id);
    if (!branch_id) return res.status(401).json({
      success: false,
      message: "No branch_id provided",
    });

    let userBranches: any = await getBranchesService(req.user);
    userBranches = userBranches.branches.map((branch) => branch.id);

    if (!userBranches.includes(branch_id)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized to operate on this branch",
      });
    }
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      success: false,
      message: "Access denied. Something went wrong.",
    });
  }
};
