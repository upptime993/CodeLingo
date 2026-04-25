import client from './client';
import type { Course, Chapter, Level, LeaderboardEntry } from '../types';

export const coursesApi = {
  list: async (): Promise<Course[]> => {
    const { data } = await client.get<Course[]>('/courses');
    return data;
  },

  chapters: async (slug: string): Promise<{ course: Course; chapters: Chapter[] }> => {
    const { data } = await client.get(`/courses/${slug}/chapters`);
    return data;
  },

  level: async (id: string): Promise<Level> => {
    const { data } = await client.get<Level>(`/courses/levels/${id}`);
    return data;
  },

  leaderboard: async (): Promise<LeaderboardEntry[]> => {
    const { data } = await client.get<LeaderboardEntry[]>('/courses/leaderboard/top');
    return data;
  },
};
