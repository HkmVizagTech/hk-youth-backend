import mongoose from "mongoose";

const circleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  tags: [{ type: String }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  leader: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Circle", circleSchema);
