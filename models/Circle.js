import mongoose from 'mongoose';

const circleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    leaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Circle', circleSchema);
