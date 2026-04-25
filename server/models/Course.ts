import mongoose, { Schema, Document } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  slug: string;
  description: string;
  icon: string;
  colorHex: string;
  difficulty: 'Pemula' | 'Menengah' | 'Mahir';
  isPublished: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    icon: { type: String, default: '📚' },
    colorHex: { type: String, default: '#C3F377' },
    difficulty: { type: String, enum: ['Pemula', 'Menengah', 'Mahir'], default: 'Pemula' },
    isPublished: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<ICourse>('Course', courseSchema);
