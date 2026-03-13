import mongoose from 'mongoose';

const qrTokenSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    nonce: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    entityType: { type: String },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('QRToken', qrTokenSchema);
