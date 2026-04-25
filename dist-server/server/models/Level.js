import mongoose, { Schema } from 'mongoose';
const questionSchema = new Schema({
    type: { type: String, enum: ['multiple_choice', 'fill_blank', 'true_false'], required: true },
    prompt: { type: String, required: true },
    options: [String],
    tokens: [String],
    correctAnswer: { type: String, required: true },
    explanation: { type: String, default: '' },
    xpReward: { type: Number, default: 10 },
});
const levelSchema = new Schema({
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
}, { timestamps: true });
export default mongoose.model('Level', levelSchema);
