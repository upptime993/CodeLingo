import mongoose, { Schema, Document } from 'mongoose';

export interface IProgress extends Document {
  userId: mongoose.Types.ObjectId;
  levelId: mongoose.Types.ObjectId;
  score: number;
  heartsUsed: number;
  completedAt: Date;
}

const progressSchema = new Schema<IProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    levelId: { type: Schema.Types.ObjectId, ref: 'Level', required: true },
    score: { type: Number, default: 100, min: 0, max: 100 },
    heartsUsed: { type: Number, default: 0, min: 0 },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Satu user hanya punya satu progress per level
progressSchema.index({ userId: 1, levelId: 1 }, { unique: true });

export default mongoose.model<IProgress>('Progress', progressSchema);
