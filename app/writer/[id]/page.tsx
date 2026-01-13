import Link from "next/link";
import { ArrowRight, Calendar, Clock, Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { readPosts } from "../../../lib/data/posts";
import { readUsers } from "../../../lib/data/users";
import styles from "./writer-profile.module.css";

export const dynamic = "force-dynamic";

export default async function WriterPublicPage({
  params
}: {
  params: { id: string };
}) {
  const data = await readPosts();
  const users = await readUsers();
  const writer = users.records.find((user) => user.id === params.id);
  const posts = data.records.filter(
    (post) => post.authorUserId === params.id && post.status === "approved"
  );
  const sorted = posts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const recent = sorted.slice(0, 5);

  const socials = writer?.socials ?? {};
  const hobbies = (writer?.hobbies ?? []).slice(0, 3);
  const categories = (writer?.categories ?? []).slice(0, 3);

  return (
    <main className={styles.wrap}>
      <section className={styles.profileCard} aria-label="Writer profile card">
        <div className={styles.profileAvatar}>
          {writer?.avatarUrl ? (
            <img src={writer.avatarUrl} alt={writer.fullName ?? "Writer avatar"} />
          ) : (
            <span>{writer?.fullName?.charAt(0) ?? "W"}</span>
          )}
        </div>

        <div className={styles.profileName}>{writer?.fullName ?? "Writer"}</div>

        <div className={styles.profileBio}>
          {writer?.bio ? writer.bio : "This writer hasn’t added a bio yet."}
        </div>

        <div className={styles.profileMeta}>
          <span className={styles.metaPill}>Posts: {sorted.length}</span>
        </div>

        {hobbies.length > 0 ? (
          <div className={styles.hobbyRow} aria-label="Hobbies">
            {hobbies.map((hobby) => (
              <span key={hobby} className={styles.hobbyItem}>
                {hobby}
              </span>
            ))}
          </div>
        ) : null}

        {categories.length > 0 ? (
          <div className={styles.catRow} aria-label="Categories">
            {categories.map((cat) => (
              <span key={cat} className={styles.catChip}>
                {cat}
              </span>
            ))}
          </div>
        ) : null}

        <div className={styles.profileSocial} aria-label="Social links">
          {socials.facebook ? (
            <a className={styles.socialIcon} href={socials.facebook} target="_blank" rel="noreferrer">
              <Facebook />
            </a>
          ) : null}
          {socials.x ? (
            <a className={styles.socialIcon} href={socials.x} target="_blank" rel="noreferrer">
              <Twitter />
            </a>
          ) : null}
          {socials.instagram ? (
            <a className={styles.socialIcon} href={socials.instagram} target="_blank" rel="noreferrer">
              <Instagram />
            </a>
          ) : null}
          {socials.youtube ? (
            <a className={styles.socialIcon} href={socials.youtube} target="_blank" rel="noreferrer">
              <Youtube />
            </a>
          ) : null}
        </div>
      </section>

      <section>
        <div className={styles.sectionTitleRow}>
          <div className={styles.sectionTitle}>Posts (5 per page)</div>
          <Link className={styles.linkBtn} href={`/writer/${params.id}/posts`}>
            View all <ArrowRight size={16} />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className={styles.emptyState}>No posts yet.</div>
        ) : (
          <div className={styles.postGrid}>
            {recent.map((post) => (
              <article key={post.id} className={styles.postCard}>
                <Link href={`/post/${post.slug}`} className={styles.postLink}>
                  <div className={styles.postThumb}>
                    {post.thumbnailLatestUrl || post.thumbnailTrendingUrl ? (
                      <img
                        src={post.thumbnailLatestUrl || post.thumbnailTrendingUrl}
                        alt={post.title}
                      />
                    ) : null}
                  </div>
                  <div className={styles.postBody}>
                    <div className={styles.postTitle}>{post.title}</div>
                    <div className={styles.postExcerpt}>{post.excerpt}</div>
                    <div className={styles.postMetaRow}>
                      <span className={styles.metaItem}>
                        <Clock size={14} />
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </span>
                      <span className={styles.metaItem}>
                        <Calendar size={14} />
                        <span>{post.category}</span>
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
