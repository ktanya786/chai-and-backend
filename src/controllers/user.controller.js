import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};
const registeredUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;
  console.log("Email:", email);

  if (
    [fullName, email, username, password].some((field) => field.trim() === "")
  ) {
    throw new ApiError(400, "Please fill in all fields");
  }
  const existeduser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existeduser) {
    throw new ApiError(409, "Username or Email already exists");
  }

  const avatarLocalFilePath = req.files?.avatar[0]?.path;
  //const coverImageLocalFilePath = req.files?.coverImage[0]?.path;

  let coverImageLocalFilePath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalFilePath = req.files.coverImage[0].path;
  } else {
    coverImageLocalFilePath = null;
  }
  if (!avatarLocalFilePath) {
    throw new ApiError(400, "Please upload an avatar");
  }

  const avatar = await uploadCloudinary(avatarLocalFilePath);
  const coverImage = await uploadCloudinary(coverImageLocalFilePath);

  const user = await User.create({
    fullName,
    email,
    username: username.toLowerCase(),
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    refreshToken: "",
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

const loginUser = asyncHandler(async (req, res) => {
  //todo list
  //1. validate the request body- username and password
  //2. check if the user exists in the database
  //3. check if the password is correct
  //4. generate a token and send it back to the client
  //5. save the token in the database
  //6. send secure cookies
  //7. send response

  const { username, email, password } = req.body;
  console.log(email);

  if (!username && !email) {
    throw new ApiError(400, "Please provide a username and email");
  }
  //todo: check if the user exists in the database
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  console.log(user._id);

  //todo: check if the password is correct
  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid password");
  }
  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "User logged in successfully !!!", {
        user: loggedInUser,
        accessToken,
        refreshToken,
      })
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  //1. check if the user is logged in
  //2. if the user is logged in, delete the refresh token from the database
  //3. delete the refresh token from the cookies
  //4. send response
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: null,
      },
    },
    { new: true }
  );

  const options = {
    secure: true,
    httpOnly: true,
  };

  res
    .status(200)
    .clearCookies("accessToken", options)
    .clearCookies("refreshToken", options)
    .json(new ApiResponse(200, "User logged out successfully!!!", ""));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  //1. check if the refresh token is valid
  //2. if the refresh token is valid, generate a new access token
  //3. send the new access token in the response

  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = verifyJWT(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Unauthorized request");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }

    // Generate a new access token
    const { accessToken, newRefreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    const options = {
      secure: true,
      httpOnly: true,
    };

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(200, "Access token generated successfully!!!", {
          accessToken,
          refreshToken: newRefreshToken,
        })
      );
  } catch (error) {
    throw new ApiError(401, "Unauthorized request");
  }
});

export { registeredUser, loginUser, logoutUser, refreshAccessToken };
