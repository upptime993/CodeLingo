// ─── TypeScript Types ──────────────────────────────────────────────────────────

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'student' | 'admin';
  totalXp: number;
  streakDays: number;
  hearts: number;
  lastActiveDate?: string;
  avatar?: string;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

// ─── Course / Chapter / Level ─────────────────────────────────────────────────
export interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  colorHex: string;
  difficulty: 'Pemula' | 'Menengah' | 'Mahir';
  isPublished: boolean;
  order: number;
  chaptersCount?: number;
  levelsCount?: number;
}

export interface Chapter {
  _id: string;
  courseId: string;
  title: string;
  description: string;
  orderIndex: number;
  levels?: LevelSummary[];
  completedCount?: number;
  totalCount?: number;
}

export interface LevelSummary {
  _id: string;
  chapterId: string;
  title: string;
  type: 'theory' | 'exercise';
  orderIndex: number;
  xpReward: number;
  status?: 'locked' | 'unlocked' | 'completed';
}

export type QuestionType = 'multiple_choice' | 'fill_blank' | 'true_false' | 'code_arrange' | 'match';

export interface MatchPair {
  left: string;
  right: string;
}

export interface Question {
  type: QuestionType;
  prompt: string;
  // multiple_choice
  options?: string[];
  // fill_blank
  tokens?: string[];
  // code_arrange
  codeBlocks?: string[];
  // match
  matchPairs?: MatchPair[];
  correctAnswer: string; // JSON string untuk code_arrange & match
  explanation?: string;
  xpReward: number;
}

export interface Level extends LevelSummary {
  theory?: {
    contentMarkdown: string;
    codeExample?: string;
  };
  questions?: Question[];
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────
export interface LeaderboardEntry {
  _id: string;
  username: string;
  avatar?: string;
  totalXp: number;
  streakDays: number;
  rank: number;
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalLevels: number;
  completionsToday: number;
}

// ─── JSON Import Payload ──────────────────────────────────────────────────────
export interface ImportQuestion {
  type: QuestionType;
  prompt: string;
  options?: string[];
  tokens?: string[];
  codeBlocks?: string[];
  matchPairs?: MatchPair[];
  correctAnswer: string;
  explanation?: string;
  xpReward?: number;
}

export interface ImportLevel {
  title: string;
  type: 'theory' | 'exercise';
  xpReward?: number;
  theory?: {
    contentMarkdown: string;
    codeExample?: string;
  };
  questions?: ImportQuestion[];
}

export interface ImportChapter {
  title: string;
  description?: string;
  levels: ImportLevel[];
}

export interface ImportPayload {
  course: {
    title: string;
    slug: string;
    description?: string;
    icon?: string;
    colorHex?: string;
    difficulty?: string;
  };
  chapters: ImportChapter[];
}
