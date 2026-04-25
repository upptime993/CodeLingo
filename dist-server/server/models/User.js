import mongoose, { Schema } from 'mongoose';
const userSchema = new Schema({
    username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    avatar: { type: String, default: '' },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    totalXp: { type: Number, default: 0, min: 0 },
    streakDays: { type: Number, default: 0, min: 0 },
    lastActiveDate: { type: Date },
    hearts: { type: Number, default: 5, min: 0, max: 5 },
}, { timestamps: true });
// Auto-generate avatar from username using DiceBear
userSchema.pre('save', function (next) {
    if (!this.avatar) {
        this.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(this.username)}`;
    }
    next();
});
export default mongoose.model('User', userSchema);
