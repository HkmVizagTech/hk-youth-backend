import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    scope: { type: String, default: 'center' },
    centerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Center' },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    lateWindowMins: { type: Number, default: 15 },
    geofenceEnabled: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Event', eventSchema);
