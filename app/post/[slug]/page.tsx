import { notFound } from "next/navigation";
import { readPosts } from "../../../lib/data/posts";
import { readUsers } from "../../../lib/data/users";
import PostClient from "./PostClient";

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: { slug: string } }) {
  const data = await readPosts();
  const users = await readUsers();
  const post = data.records.find(
    (record) => record.slug === params.slug && record.status === "approved"
  );
  if (!post) {
    notFound();
  }
  const author = users.records.find((user) => user.id === post.authorUserId);
  const related = data.records
    .filter(
      (record) =>
        record.category === post.category &&
        record.status === "approved" &&
        record.id !== post.id
    )
    .slice(0, 5);

  return <PostClient post={post} author={author} related={related} users={users.records} />;
}
