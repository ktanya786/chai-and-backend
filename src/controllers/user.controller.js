import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const registeredUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;
  console.log("Email:", email);

  if (
    [fullName, email, username, password].some((field) => field.trim() === "")
  ) {
    throw new ApiError(400, "Please fill in all fields");
  }
  const existeduser = User.findOne({
    $or: [{ username }, { email }],
  });
  if (existeduser) {
    throw new ApiError(409, "Username or Email already exists");
  }

  const avatarLocalFilePath = req.files?.avatar[0]?.path;
  const coverImageLocalFilePath = req.files?.coverImage[0]?.path;
  if (!avatarLocalFilePath) {
    throw new ApiError(400, "Please upload an avatar");
  }

  const avatar = await uploadCloudinary(avatarLocalFilePath);
  const coverImage = await uploadCloudinary(coverImageLocalFilePath);

  const user = await User.create({
    fullName,
    email,
    username: username.toLowercase(),
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(
      "500",
      "Something went wrong while registering the user"
    );
  }

  return res.status(201).json(
    new ApiResponse({
      statusCode: 200,
      message: "User created successfully",
      data: createdUser,
    })
  );
});
