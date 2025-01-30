import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
    },
    watchedHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Pasword is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.method.isPasswordCorrect = async function (next) {
  return await bcrypt.compare(password, this.password);
};

userSchema.method.generateAccessToken = function (next) {
  jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET
  ),
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    };
};

userSchema.method.generateRefreshToken = function (next) {
  jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET
  ),
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    };
};

export const User = mongoose.model("User", userSchema);
