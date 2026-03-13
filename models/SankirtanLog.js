import mongoose from 'mongoose';

const sankirtanLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mahaBig: { type: Number, default: 0 },
    big: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    small: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    location: { type: String },
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('SankirtanLog', sankirtanLogSchema);
