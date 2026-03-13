import mongoose from 'mongoose';

const batchGuideSchema = new mongoose.Schema({
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isLead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

batchGuideSchema.index({ batchId: 1, userId: 1 }, { unique: true });

export default mongoose.model('BatchGuide', batchGuideSchema);
