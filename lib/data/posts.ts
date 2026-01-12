import { randomUUID } from "crypto";
import { readDataFile, writeDataFile } from "../jsonDb";
import { Post, PostStatus } from "../types";
import { slugify } from "../utils/slugify";

const POSTS_FILE = "posts.json";

export async function readPosts() {
  const data = await readDataFile<Post>(POSTS_FILE);
  let needsRewrite = false;
  data.records = data.records.map((post) => {
    const updated = { ...post } as Post;
    if (!updated.category) {
      updated.category = "Technology";
      needsRewrite = true;
    }
    if (!Array.isArray(updated.likes)) {
      updated.likes = [];
      needsRewrite = true;
    }
    if (!Array.isArray(updated.comments)) {
      updated.comments = [];
      needsRewrite = true;
    }
    return updated;
  });
  if (needsRewrite) {
    await writePosts(data.records);
  }
  return data;
}

export async function writePosts(posts: Post[]) {
  await writeDataFile(POSTS_FILE, { version: 1, records: posts });
}

export async function createPost(params: {
  title: string;
  content: string;
  excerpt: string;
  thumbnailLatestUrl?: string;
  thumbnailTrendingUrl?: string;
  category: string;
  tags: string[];
  authorUserId: string;
}) {
  const data = await readPosts();
  const now = new Date().toISOString();
  const baseSlug = slugify(params.title);
  let slug = baseSlug;
  let counter = 1;
  while (data.records.some((post) => post.slug === slug)) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
  const post: Post = {
    id: randomUUID(),
    title: params.title,
    slug,
    content: params.content,
    excerpt: params.excerpt,
    thumbnailLatestUrl: params.thumbnailLatestUrl || undefined,
    thumbnailTrendingUrl: params.thumbnailTrendingUrl || undefined,
    category: params.category,
    tags: params.tags,
    authorUserId: params.authorUserId,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    likes: [],
    comments: []
  };
  const updated = [...data.records, post];
  await writePosts(updated);
  return post;
}

export async function updatePost(id: string, updates: Partial<Post>) {
  const data = await readPosts();
  let found: Post | undefined;
  const updated = data.records.map((post) => {
    if (post.id !== id) return post;
    found = { ...post, ...updates };
    return found;
  });
  if (!found) {
    throw new Error("Post not found.");
  }
  await writePosts(updated);
  return found;
}

export function filterPostsByStatus(posts: Post[], status: PostStatus) {
  return posts.filter((post) => post.status === status);
}

export function sortPostsByDate(posts: Post[]) {
  return posts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
