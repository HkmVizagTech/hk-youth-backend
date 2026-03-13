import mongoose from 'mongoose';

const sadhanaLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
    japaRounds: { type: Number, default: 0 },
    wokeUpAt: { type: String },
    sleptAt: { type: String },
    readingTime: { type: Number, default: 0 },
    hearingTime: { type: Number, default: 0 },
    sevaTime: { type: Number, default: 0 },
    principlesFollowed: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

sadhanaLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model('SadhanaLog', sadhanaLogSchema);
