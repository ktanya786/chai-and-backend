import { asyncHandler } from "../utils/asyncHandler.js";

export const registeredUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: "Ok",
  });
});
