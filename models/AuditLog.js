import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    actorId: { type: String, required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    provider: { type: String },
    payload: { type: mongoose.Schema.Types.Mixed },
    response: { type: mongoose.Schema.Types.Mixed },
    status: { type: String },
    ipAddress: { type: String },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('AuditLog', auditLogSchema);
