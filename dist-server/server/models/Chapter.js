import mongoose, { Schema } from 'mongoose';
const chapterSchema = new Schema({
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    orderIndex: { type: Number, default: 0 },
}, { timestamps: true });
export default mongoose.model('Chapter', chapterSchema);
