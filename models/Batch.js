import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
    centerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Center', required: true },
    name: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Batch', batchSchema);
