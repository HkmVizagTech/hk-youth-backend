import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const threadSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  isGroup: { type: Boolean, default: false },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  messages: [messageSchema],
  lastMessage: { type: String, default: "" },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Thread", threadSchema);
