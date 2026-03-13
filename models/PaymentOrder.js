import mongoose from 'mongoose';

const paymentOrderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    entityType: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    razorpayOrderId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, default: 'created' },
    paymentId: { type: String },
    signature: { type: String },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('PaymentOrder', paymentOrderSchema);
