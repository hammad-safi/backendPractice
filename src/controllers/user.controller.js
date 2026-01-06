import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiSuccess.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

export const registerUser = asyncHandler(async (req, res, next) => {
  console.log("✅ Controller started");
  
  const { userName, fullName, email, password } = req.body;

  if (!userName || !email || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const exists = await User.findOne({ email });
  if (exists) {
    throw new ApiError(409, "User already exists");
  }

  console.log("✅ Before file handling");

  // Get local file paths from multer
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  console.log("📁 Avatar path:", avatarLocalPath);
  console.log("📁 Cover image path:", coverImageLocalPath);

  // Upload to Cloudinary
  let avatarUrl = "";
  let coverImageUrl = "";

  try {
    if (avatarLocalPath) {
      console.log("⬆️ Uploading avatar to Cloudinary...");
      const avatarUpload = await uploadOnCloudinary(avatarLocalPath);
      avatarUrl = avatarUpload.secure_url;
      console.log("✅ Avatar uploaded:", avatarUrl);
    }

    if (coverImageLocalPath) {
      console.log("⬆️ Uploading cover image to Cloudinary...");
      const coverImageUpload = await uploadOnCloudinary(coverImageLocalPath);
      coverImageUrl = coverImageUpload.secure_url;
      console.log("✅ Cover image uploaded:", coverImageUrl);
    }
  } catch (error) {
    console.log("❌ Cloudinary upload error:", error);
    throw new ApiError(500, "Failed to upload images");
  }

  console.log("✅ Before user creation");

  // Create user
  const user = await User.create({
    userName,
    fullName,
    email,
    password,
    avatar: avatarUrl,
    coverImage: coverImageUrl,
  });

  console.log("✅ User created");

  // Remove password from response
  const userResponse = await User.findById(user._id).select("-password");

  console.log("✅ Sending response");

  res.status(201).json(
    new ApiResponse(201, userResponse, "User registered successfully")
  );
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1️⃣ Validate input
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // 2️⃣ Find user (include password explicitly)
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // 3️⃣ Compare password
  const isPasswordValid = await user.passwordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  // 4️⃣ Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // 5️⃣ Save refresh token in DB
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // 6️⃣ Remove password from response
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  // 7️⃣ Cookie options
  const cookieOptions = {
    httpOnly: true,
    secure: true, // true in production
    sameSite: "strict",
  };

  // 8️⃣ Send response
  res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  // Remove refresh token from DB
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 },
    },
    { new: true }
  );

  // Cookie options (must match login)
  const options = {
    httpOnly: true,
    secure: false, // true in production
    sameSite: "lax",
  };

  // Clear cookies
  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResponse(200, {}, "User logged out successfully")
    );
});