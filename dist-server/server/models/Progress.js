import mongoose, { Schema } from 'mongoose';
const progressSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    levelId: { type: Schema.Types.ObjectId, ref: 'Level', required: true },
    score: { type: Number, default: 100, min: 0, max: 100 },
    heartsUsed: { type: Number, default: 0, min: 0 },
    completedAt: { type: Date, default: Date.now },
}, { timestamps: true });
// Satu user hanya punya satu progress per level
progressSchema.index({ userId: 1, levelId: 1 }, { unique: true });
export default mongoose.model('Progress', progressSchema);
