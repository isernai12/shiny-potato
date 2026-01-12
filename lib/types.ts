export type Role = "admin" | "writer" | "user";

export type User = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
};

export type Session = {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

export type WriterRequestStatus = "pending" | "approved" | "rejected";

export type WriterRequest = {
  id: string;
  userId: string;
  createdAt: string;
  status: WriterRequestStatus;
  reviewedAt?: string;
  reviewNote?: string;
};

export type PostStatus = "draft" | "submitted" | "approved" | "rejected";

export type Post = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImageUrl?: string;
  tags: string[];
  authorUserId: string;
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewNote?: string;
};

export type DataFile<T> = {
  version: number;
  records: T[];
};
