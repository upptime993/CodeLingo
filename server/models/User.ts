import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  avatar: string;
  role: 'student' | 'admin';
  totalXp: number;
  streakDays: number;
  lastActiveDate?: Date;
  hearts: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
    // U-08: Tambah validasi format email agar email asal-asalan tidak masuk DB
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Format email tidak valid'],
    },
    password: { type: String, required: true, minlength: 6 },
    avatar: { type: String, default: '' },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    totalXp: { type: Number, default: 0, min: 0 },
    streakDays: { type: Number, default: 0, min: 0 },
    lastActiveDate: { type: Date },
    hearts: { type: Number, default: 5, min: 0, max: 5 },
  },
  { timestamps: true }
);

// Auto-generate avatar from username using DiceBear
userSchema.pre('save', function (this: IUser) {
  if (!this.avatar) {
    this.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(this.username)}`;
  }
});

export default mongoose.model<IUser>('User', userSchema);
