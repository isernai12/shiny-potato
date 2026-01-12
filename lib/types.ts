export type Role = "admin" | "user";

export type SocialLinks = {
  facebook?: string;
  x?: string;
  instagram?: string;
  youtube?: string;
  github?: string;
  website?: string;
};

export type User = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;

  // ✅ NEW
  socials?: SocialLinks;
  hobbies?: string[]; // max 3
  categories?: string[]; // max 3

  passwordHash: string;
  role: Role;
  suspended?: boolean;
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
  thumbnailLatestUrl?: string;
  thumbnailTrendingUrl?: string;
  category: string;
  tags: string[];
  authorUserId: string;
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewNote?: string;
  likes: string[];
  comments: Comment[];
  engagementTotalSeconds?: number;
  engagementCount?: number;
};

export type Comment = {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  likes: string[];
};

export type PostReportStatus = "pending" | "rejected" | "actioned";

export type PostReport = {
  id: string;
  postId: string;
  postSlug: string;
  reporterUserId: string;
  reason: string;
  createdAt: string;
  status: PostReportStatus;
  reviewedAt?: string;
  reviewNote?: string;
};

export type CommentReportStatus = "pending" | "rejected" | "actioned";

export type CommentReport = {
  id: string;
  postId: string;
  postSlug: string;
  commentId: string;
  reporterUserId: string;
  reason: string;
  createdAt: string;
  status: CommentReportStatus;
  reviewedAt?: string;
  reviewNote?: string;
};

export type AuditLogEntry = {
  id: string;
  actorUserId: string;
  action: string;
  target?: string;
  createdAt: string;
  meta?: Record<string, string>;
};

export type SiteStats = {
  totalViews: number;
  uniqueVisitors: number;
  last24hViews: number;
  topPage: string;
  avgSessionSeconds: number;
  bounceRate: number;
  errorsToday: number;
  uptimeSeconds: number;
  engagementRate: number;
};

export type DataFile<T> = {
  version: number;
  records: T[];
};
