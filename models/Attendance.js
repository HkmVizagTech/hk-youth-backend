import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scannerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, default: 'Daily' },
    status: { type: String, default: 'Present' },
    location: { type: String },
    checkInTime: { type: Date, default: Date.now }
});

export default mongoose.model('Attendance', attendanceSchema);
