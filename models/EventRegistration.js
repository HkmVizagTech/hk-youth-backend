import mongoose from 'mongoose';

const eventRegistrationSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, default: 'registered' },
    createdAt: { type: Date, default: Date.now }
});

eventRegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export default mongoose.model('EventRegistration', eventRegistrationSchema);
