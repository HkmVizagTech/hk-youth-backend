import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
    devotee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    checkInTime: {
        type: Date,
        default: Date.now
    },
    scannedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: ["Daily", "Prasadam", "Event", "Night Session"],
        default: "Daily"
    },
    status: {
        type: String,
        enum: ["Present", "Late", "Excused"],
        default: "Present"
    },
    location: {
        type: String,
        default: "Main Hall"
    }
});

// Avoid multiple check-ins of the same type in a short window (e.g., 1 hour)
attendanceSchema.index({ devotee: 1, type: 1, checkInTime: -1 });

export default mongoose.model("Attendance", attendanceSchema);
