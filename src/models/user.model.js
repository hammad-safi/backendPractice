import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      index: true,
      minlength: [3, "Full Name must be at least 3 characters"],
      maxlength: [50, "Full Name cannot exceed 50 characters"],
    },
    fullName: {
      type: String,
      required: [true, "Full Name is required"],
      trim: true,
      index: true,
      minlength: [3, "Full Name must be at least 3 characters"],
      maxlength: [50, "Full Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [
        /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
        "Please provide a valid email",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      trim: true,
      select: false,
    },

    avatar: {
      type: String,
      default: "",
    //   trim: true,
    },

    coverImage: {
      type: String,
    //   default: "",
    //   trim: true,
    },

    watchHistory: [{
      type: Schema.Types.ObjectId,
      ref: "video"
    }],
    refreshToken: {
      type: String,
 
    },
  },
  { timestamps: true }
);
// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});
// Compare entered password with hashed password
userSchema.methods.passwordCorrect = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
// Generate Access Token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      userName : this.userName,
      fullName: this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m",
    }
  );
};
// Generate Refresh Token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d",
    }
  );
};

// Optional compound index
// userSchema.index({ fullName: 1, email: 1 });

export const User = mongoose.model("User", userSchema);
