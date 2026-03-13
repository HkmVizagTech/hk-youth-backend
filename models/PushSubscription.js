import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    endpoint: { type: String, required: true, unique: true },
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
    userAgent: { type: String },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('PushSubscription', pushSubscriptionSchema);
