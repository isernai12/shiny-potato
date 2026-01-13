import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Clock,
  Layers,
  Moon,
  Search,
  Sun,
  Tag
} from "lucide-react";
import { readPosts } from "../../../lib/data/posts";
import { readUsers } from "../../../lib/data/users";
import styles from "./categories.module.css";

export const dynamic = "force-dynamic";

type CategoryItem = {
  name: string;
  icon: JSX.Element;
};

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function estimateReadMinutes(excerpt: string) {
  const words = excerpt.trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 40));
  return `${mins} min`;
}

function categoryIcon(name: string) {
  switch (name.toLowerCase()) {
    case "all":
      return <Layers />;
    default:
      return <Tag />;
  }
}

function buildQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export default async function CategoriesPage({
  searchParams
}: {
  searchParams: { cat?: string; q?: string };
}) {
  const data = await readPosts();
  const users = await readUsers();
  const posts = data.records.filter((post) => post.status === "approved");
  const categories = Array.from(new Set(posts.map((post) => post.category).filter(Boolean)));
  const activeCategory = searchParams.cat && categories.includes(searchParams.cat) ? searchParams.cat : "All";
  const query = (searchParams.q ?? "").trim().toLowerCase();

  const categoryItems: CategoryItem[] = [
    { name: "All", icon: categoryIcon("all") },
    ...categories.map((name) => ({ name, icon: categoryIcon(name) }))
  ];

  const filtered = posts.filter((post) => {
    const byCategory = activeCategory === "All" ? true : post.category === activeCategory;
    const byQuery = !query ? true : post.title.toLowerCase().includes(query);
    return byCategory && byQuery;
  });

  const topPosts = filtered.slice(0, 6);

  return (
    <main className={styles.wrap}>
      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <div>
            <div className={styles.title}>Browse by Category</div>
            <div className={styles.sub}>
              এখানে ২০–৩০+ ক্যাটাগরি থাকলেও স্ক্রলেবল ক্যাটাগরি বার দিয়ে সুন্দরভাবে কাজ করবে।
              নিচে প্রতিটি পোস্টের সাথে রাইটারের ছবি + নাম থাকবে।
            </div>
          </div>

          <button className={styles.themeBtn} type="button" aria-label="Toggle theme">
            <Moon />
            <Sun style={{ display: "none" }} />
          </button>
        </div>

        <form className={styles.tools} action="/categories" method="get">
          <input
            className={styles.toolInput}
            type="search"
            name="q"
            placeholder="Search posts by title"
            defaultValue={searchParams.q ?? ""}
          />
          <input type="hidden" name="cat" value={activeCategory} />
          <button className={styles.pillBtn} type="submit">
            <Search />
            <span>Search</span>
          </button>
        </form>

        <div className={styles.catBar} aria-label="Category bar">
          <div className={styles.fadeL} />
          <div className={styles.fadeR} />
          <div className={styles.catScroll}>
            {categoryItems.map((item) => {
              const isActive = item.name === activeCategory;
              return (
                <Link
                  key={item.name}
                  href={`/categories${buildQuery({
                    cat: item.name === "All" ? undefined : item.name,
                    q: searchParams.q
                  })}`}
                  className={`${styles.chip} ${isActive ? styles.chipActive : ""}`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className={styles.mobileSelectRow}>
          <form action="/categories" method="get" className={styles.tools}>
            <select className={styles.select} name="cat" defaultValue={activeCategory}>
              {categoryItems.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
            <input type="hidden" name="q" value={searchParams.q ?? ""} />
            <button className={styles.pillBtn} type="submit">
              Apply
            </button>
            <Link className={styles.pillBtn} href="/categories">
              Reset
            </Link>
          </form>
        </div>
      </section>

      <div className={styles.secHead}>
        <div className={styles.secTitle}>Posts</div>
        <div className={styles.secMeta}>
          Showing: {activeCategory === "All" ? "All" : activeCategory}
          {query ? ` • Search: "${searchParams.q}"` : ""}
        </div>
      </div>

      <section className={styles.postsWrap}>
        <div className={styles.postsHead}>
          <div className={styles.postsHeadLeft}>
            <div className={styles.activeCat}>
              {categoryIcon(activeCategory)}
              <span>{activeCategory}</span>
            </div>
            <div className={styles.smallHint}>
              {activeCategory === "All"
                ? "Top posts from all categories"
                : `Top posts from ${activeCategory}`}
            </div>
          </div>

          <Link
            className={styles.miniBtn}
            href={`/categories/view-all${buildQuery({
              cat: activeCategory === "All" ? undefined : activeCategory,
              q: searchParams.q
            })}`}
          >
            <ArrowRight />
            <span>View all</span>
          </Link>
        </div>

        <div className={styles.postsBody}>
          {topPosts.length === 0 ? (
            <div className={styles.empty}>No posts found.</div>
          ) : (
            topPosts.map((post) => {
              const author = users.records.find((user) => user.id === post.authorUserId);
              return (
                <Link key={post.id} href={`/post/${post.slug}`} className={styles.postCard}>
                  <div className={styles.thumb}>
                    {post.thumbnailLatestUrl || post.thumbnailTrendingUrl ? (
                      <img
                        src={post.thumbnailLatestUrl || post.thumbnailTrendingUrl}
                        alt={post.title}
                      />
                    ) : null}
                  </div>
                  <div className={styles.body}>
                    <div className={styles.pTitle}>{post.title}</div>
                    <div className={styles.pEx}>{post.excerpt}</div>
                    <div className={styles.metaRow}>
                      <span className={styles.meta}>
                        <Clock />
                        <span>{estimateReadMinutes(post.excerpt)}</span>
                      </span>
                      <span className={styles.meta}>
                        <Calendar />
                        <span>{formatDate(post.createdAt)}</span>
                      </span>
                    </div>
                    <div className={styles.authorRow}>
                      <div className={styles.authorLeft}>
                        <div className={styles.authorAvatar}>
                          {author?.avatarUrl ? (
                            <img src={author.avatarUrl} alt={author.fullName} />
                          ) : (
                            <span>{author?.fullName?.charAt(0) ?? "W"}</span>
                          )}
                        </div>
                        <div className={styles.authorName}>{author?.fullName ?? "Writer"}</div>
                      </div>
                      <span className={styles.miniBtn}>
                        <ArrowRight />
                        <span>Read</span>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
