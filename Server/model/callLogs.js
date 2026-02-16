import mongoose from "mongoose";

const callLogSchema = new mongoose.Schema(
  {
    cloguserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    operationtype: {
      type: String,
      enum: ["Voice Call", "Video Call", "Card Recharge"],
      default: "missed",
    },
    callerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    callStart: {
      type: Date,
      default: Date.now,
    },
    callEnd: {
      type: Date,
    },
    totalTime: {
      type: Number, // Duration in seconds
      default: 0,
    },
    status: {
      type: String,
      enum: ["completed", "missed", "rejected", "Other"],
      default: "missed",
    },
  },
  { timestamps: true },
);

export const CallLog = mongoose.model("CallLog", callLogSchema);