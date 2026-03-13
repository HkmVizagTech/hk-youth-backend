import mongoose from 'mongoose';

const threadSchema = new mongoose.Schema({
    name: { type: String },
    isGroup: { type: Boolean, default: false },
    participantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: { type: String },
    updatedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Thread', threadSchema);
