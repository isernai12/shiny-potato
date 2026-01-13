import { readPosts } from "../../lib/data/posts";
import { filterPostsByStatus, sortPostsByDate } from "../../lib/data/posts";
import { readUsers } from "../../lib/data/users";
import HomeClient from "../components/HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await readPosts();
  const users = await readUsers();
  const approved = sortPostsByDate(filterPostsByStatus(data.records, "approved"));

  return <HomeClient posts={approved} users={users.records} />;
}
