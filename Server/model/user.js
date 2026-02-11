import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    ph: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    // profilePic: {
    //   name: String,
    //   contentType: String,
    //   data: Buffer,
    // },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
