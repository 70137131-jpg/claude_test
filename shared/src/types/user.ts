export interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
  avatar?: string;
  githubId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateInput {
  email: string;
  name: string;
  password?: string;
  avatar?: string;
  githubId?: string;
}

export interface UserUpdateInput {
  email?: string;
  name?: string;
  password?: string;
  avatar?: string;
}

export type UserPublic = Omit<User, 'password'>;
