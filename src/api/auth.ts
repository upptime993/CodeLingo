import client from './client';
import type { AuthResponse, LoginCredentials, RegisterCredentials, User } from '../types';

export const authApi = {
  login: async (creds: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await client.post<AuthResponse>('/auth/login', creds);
    return data;
  },

  register: async (creds: RegisterCredentials): Promise<AuthResponse> => {
    const { data } = await client.post<AuthResponse>('/auth/register', creds);
    return data;
  },

  me: async (): Promise<User> => {
    const { data } = await client.get<User>('/auth/me');
    return data;
  },
};
