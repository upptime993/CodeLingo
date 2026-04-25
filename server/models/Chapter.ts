import mongoose, { Schema, Document } from 'mongoose';

export interface IChapter extends Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  orderIndex: number;
}

const chapterSchema = new Schema<IChapter>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    orderIndex: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IChapter>('Chapter', chapterSchema);
