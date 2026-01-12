import Link from "next/link";
import { FileText, PenLine, Search, Sparkles, Users } from "lucide-react";
import { readPosts } from "../../lib/data/posts";
import { readUsers } from "../../lib/data/users";
import styles from "./writers.module.css";

export const dynamic = "force-dynamic";

type WriterCard = {
  id: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  postCount: number;
};

export default async function WritersPage({
  searchParams
}: {
  searchParams: { q?: string };
}) {
  const query = (searchParams.q ?? "").trim().toLowerCase();
  const users = await readUsers();
  const posts = await readPosts();
  const approvedPosts = posts.records.filter((post) => post.status === "approved");
  const postCounts = approvedPosts.reduce<Map<string, number>>((map, post) => {
    map.set(post.authorUserId, (map.get(post.authorUserId) ?? 0) + 1);
    return map;
  }, new Map());

  const writers = users.records
    .map<WriterCard>((user) => ({
      id: user.id,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      postCount: postCounts.get(user.id) ?? 0
    }))
    .filter((writer) => writer.postCount > 0)
    .filter((writer) => (!query ? true : writer.fullName.toLowerCase().includes(query)))
    .sort((a, b) => b.postCount - a.postCount);

  return (
    <main className={styles.writoPageWrap}>
      <section className={styles.writoHero}>
        <div className={styles.writoHeroTop}>
          <div>
            <div className={styles.writoTitle}>Writers</div>
            <div className={styles.writoSub}>
              Discover creators and their topics. Search writers, explore their work, and apply to
              become a writer.
            </div>
          </div>

          <div className={styles.writoHeroActions}>
            <Link className={styles.writoPillBtn} href="/profile">
              <PenLine />
              <span>Become a Writer</span>
            </Link>
          </div>
        </div>

        <form className={styles.writoSearchWrap} action="/writers" method="get">
          <input
            className={styles.writoToolInput}
            type="search"
            name="q"
            placeholder="Search writers"
            defaultValue={searchParams.q ?? ""}
            aria-label="Search writers"
          />
          <button className={styles.writoPillBtn} type="submit">
            <Search />
            <span>Search</span>
          </button>
        </form>

        <div className={styles.writoInfoRow}>
          <div className={styles.writoInfoChip}>
            <Users />
            <span>{writers.length} writers listed</span>
          </div>
          <div className={styles.writoInfoChip}>
            <FileText />
            <span>Topic-based writing</span>
          </div>
          <div className={styles.writoInfoChip}>
            <Sparkles />
            <span>Curated creators</span>
          </div>
        </div>
      </section>

      <div className={styles.writoSectionTitle}>All Writers</div>

      {writers.length === 0 ? (
        <div className={styles.emptyState}>No writers found.</div>
      ) : (
        <section className={styles.writoGrid}>
          {writers.map((writer) => (
            <Link key={writer.id} href={`/writer/${writer.id}`} className={styles.writerCard}>
              <div className={styles.writerAvatar}>
                {writer.avatarUrl ? (
                  <img src={writer.avatarUrl} alt={writer.fullName} />
                ) : (
                  <span>{writer.fullName.charAt(0) ?? "W"}</span>
                )}
              </div>
              <div className={styles.writerName}>{writer.fullName}</div>
              <div className={styles.writerPostsRow}>
                <FileText />
                <span>{writer.postCount} posts</span>
              </div>
              <div className={styles.writerBio}>
                {writer.bio ? writer.bio : "This writer hasn’t added a bio yet."}
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
