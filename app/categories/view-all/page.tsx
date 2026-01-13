import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  FileText,
  Layers,
  Moon,
  Search,
  Sun,
  Tag
} from "lucide-react";
import { readPosts } from "../../../lib/data/posts";
import { readUsers } from "../../../lib/data/users";
import styles from "./view-all.module.css";

export const dynamic = "force-dynamic";

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

function getPageRange(current: number, total: number) {
  const maxButtons = 5;
  let start = Math.max(1, current - 2);
  let end = Math.min(total, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export default async function CategoryViewAllPage({
  searchParams
}: {
  searchParams: { cat?: string; q?: string; page?: string; per?: string };
}) {
  const data = await readPosts();
  const users = await readUsers();
  const posts = data.records.filter((post) => post.status === "approved");
  const categories = Array.from(new Set(posts.map((post) => post.category).filter(Boolean)));
  const activeCategory = searchParams.cat && categories.includes(searchParams.cat) ? searchParams.cat : "All";
  const query = (searchParams.q ?? "").trim().toLowerCase();
  const per = Number(searchParams.per ?? "20");
  const perPage = per === 30 ? 30 : 20;
  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);

  const filtered = posts.filter((post) => {
    const byCategory = activeCategory === "All" ? true : post.category === activeCategory;
    const byQuery = !query ? true : post.title.toLowerCase().includes(query);
    return byCategory && byQuery;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const sliceStart = (currentPage - 1) * perPage;
  const sliceEnd = sliceStart + perPage;
  const visible = filtered.slice(sliceStart, sliceEnd);

  const categoryItems = ["All", ...categories];

  return (
    <main className={styles.wrap}>
      <section className={styles.top}>
        <div className={styles.topRow}>
          <div>
            <div className={styles.title}>View all posts</div>
            <div className={styles.sub}>
              Category / search অনুযায়ী সব পোস্ট এখানে পেজিনেশনসহ দেখাবে।
            </div>
          </div>

          <button className={styles.themeBtn} type="button" aria-label="Toggle theme">
            <Moon />
            <Sun style={{ display: "none" }} />
          </button>
        </div>

        <form className={styles.filters} action="/categories/view-all" method="get">
          <input
            className={styles.toolInput}
            type="search"
            name="q"
            placeholder="Search posts by title..."
            defaultValue={searchParams.q ?? ""}
          />
          <select className={styles.select} name="per" defaultValue={String(perPage)}>
            <option value="20">20 / page</option>
            <option value="30">30 / page</option>
          </select>
          <input type="hidden" name="cat" value={activeCategory} />
          <button className={styles.pillBtn} type="submit">
            <Search />
            <span>Search</span>
          </button>
          <Link className={styles.pillBtn} href="/categories/view-all">
            Reset
          </Link>
        </form>

        <div className={styles.catBar} aria-label="Category bar">
          <div className={styles.fadeL} />
          <div className={styles.fadeR} />
          <div className={styles.catScroll}>
            {categoryItems.map((item) => {
              const isActive = item === activeCategory;
              return (
                <Link
                  key={item}
                  href={`/categories/view-all${buildQuery({
                    cat: item === "All" ? undefined : item,
                    q: searchParams.q,
                    per: String(perPage),
                    page: "1"
                  })}`}
                  className={`${styles.chip} ${isActive ? styles.chipActive : ""}`}
                >
                  {categoryIcon(item)}
                  <span>{item}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <div className={styles.metaLine}>
        <div className={styles.metaLeft}>
          <span>
            {categoryIcon(activeCategory)}
            <span>{activeCategory}</span>
          </span>
          <span>
            <FileText />
            <span>{filtered.length} posts</span>
          </span>
        </div>
        <div className={styles.metaRight}>
          {query ? `Search: "${searchParams.q}" • ` : ""}Page {currentPage}/{totalPages}
        </div>
      </div>

      <section className={styles.list}>
        <div className={styles.listInner}>
          {visible.length === 0 ? (
            <div className={styles.empty}>No posts found.</div>
          ) : (
            visible.map((post) => {
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
                      <span className={styles.meta}>
                        <Tag />
                        <span>{post.category}</span>
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

        <div className={styles.pager}>
          <div className={styles.pageBtns}>
            <Link
              className={styles.pageBtn}
              aria-disabled={currentPage <= 1}
              href={`/categories/view-all${buildQuery({
                cat: activeCategory === "All" ? undefined : activeCategory,
                q: searchParams.q,
                per: String(perPage),
                page: String(Math.max(1, currentPage - 1))
              })}`}
            >
              <ArrowLeft />
              <span>Prev</span>
            </Link>
            {getPageRange(currentPage, totalPages).map((pageNumber) => {
              const isActive = pageNumber === currentPage;
              return (
                <Link
                  key={pageNumber}
                  className={`${styles.pageBtn} ${isActive ? styles.pageBtnActive : ""}`}
                  href={`/categories/view-all${buildQuery({
                    cat: activeCategory === "All" ? undefined : activeCategory,
                    q: searchParams.q,
                    per: String(perPage),
                    page: String(pageNumber)
                  })}`}
                >
                  {pageNumber}
                </Link>
              );
            })}
            <Link
              className={styles.pageBtn}
              aria-disabled={currentPage >= totalPages}
              href={`/categories/view-all${buildQuery({
                cat: activeCategory === "All" ? undefined : activeCategory,
                q: searchParams.q,
                per: String(perPage),
                page: String(Math.min(totalPages, currentPage + 1))
              })}`}
            >
              <span>Next</span>
              <ArrowRight />
            </Link>
          </div>
          <div className={styles.pagerInfo}>
            {filtered.length === 0 ? "0" : sliceStart + 1}-{Math.min(sliceEnd, filtered.length)} of{" "}
            {filtered.length} • {perPage}/page
          </div>
        </div>
      </section>
    </main>
  );
}
