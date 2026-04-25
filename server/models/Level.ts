import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion {
  type: 'multiple_choice' | 'fill_blank' | 'true_false' | 'code_arrange' | 'match';
  prompt: string;
  // multiple_choice
  options?: string[];
  // fill_blank (token drag)
  tokens?: string[];
  // code_arrange (blok kode yang perlu diurutkan)
  codeBlocks?: string[];
  // match (pasangkan kiri-kanan)
  matchPairs?: { left: string; right: string }[];
  correctAnswer: string; // JSON string untuk code_arrange & match
  explanation?: string;
  xpReward: number;
}

export interface ILevel extends Document {
  chapterId: mongoose.Types.ObjectId;
  title: string;
  type: 'theory' | 'exercise';
  orderIndex: number;
  xpReward: number;
  theory?: {
    contentMarkdown: string;
    codeExample?: string;
  };
  questions?: IQuestion[];
}

const questionSchema = new Schema<IQuestion>({
  type: {
    type: String,
    enum: ['multiple_choice', 'fill_blank', 'true_false', 'code_arrange', 'match'],
    required: true,
  },
  prompt: { type: String, required: true },
  options: [String],
  tokens: [String],
  codeBlocks: [String],
  matchPairs: [{ left: String, right: String }],
  correctAnswer: { type: String, required: true },
  explanation: { type: String, default: '' },
  xpReward: { type: Number, default: 10 },
});

const levelSchema = new Schema<ILevel>(
  {
    chapterId: { type: Schema.Types.ObjectId, ref: 'Chapter', required: true, index: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ['theory', 'exercise'], required: true },
    orderIndex: { type: Number, default: 0 },
    xpReward: { type: Number, default: 10 },
    theory: {
      contentMarkdown: String,
      codeExample: String,
    },
    questions: [questionSchema],
  },
  { timestamps: true }
);

export default mongoose.model<ILevel>('Level', levelSchema);
