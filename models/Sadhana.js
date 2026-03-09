import mongoose from "mongoose";

const sadhanaSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  japaRounds: { type: Number, default: 0 },
  readingMinutes: { type: Number, default: 0 },
  morningArati: { type: Boolean, default: false },
  eveningArati: { type: Boolean, default: false },
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

// Unique log per user per day
sadhanaSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model("Sadhana", sadhanaSchema);
