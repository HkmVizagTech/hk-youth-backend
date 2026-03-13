import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, default: 'realization' },
    content: { type: String, required: true },
    media: [mongoose.Schema.Types.Mixed],
    likes: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Post', postSchema);
