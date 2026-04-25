import client from './client';

export const progressApi = {
  complete: async (payload: {
    levelId: string;
    score: number;
    heartsUsed: number;
  }) => {
    const { data } = await client.post('/progress/complete', payload);
    return data;
  },
};
