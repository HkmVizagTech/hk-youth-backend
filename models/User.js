import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  spiritualName: { type: String, default: "" },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["youth", "member", "guide", "admin", "head", "security"], default: "member" },
  avatarSeed: { type: Number, default: 0 },
  center: { type: String, default: "FOLK HKM Visakhapatnam" },
  batch: { type: String, default: "" },
  guideId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
