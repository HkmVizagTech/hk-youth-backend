import mongoose from 'mongoose';

const centerSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    timezone: { type: String, required: true },
    deityName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Center', centerSchema);
