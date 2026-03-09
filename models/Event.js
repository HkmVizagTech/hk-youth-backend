import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  date: { type: Date, required: true },
  location: { type: String, default: "" },
  type: { type: String, enum: ["program", "trip", "camp", "online"], default: "program" },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  registeredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  maxCapacity: { type: Number, default: 100 },
  imageUrl: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Event", eventSchema);
