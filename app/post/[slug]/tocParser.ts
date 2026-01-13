export type ParsedToc = {
  html: string;
  items: { id: string; title: string }[];
};

function safeSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/<[^>]*>/g, "")
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function parseTocFromContent(raw: string): ParsedToc {
  const lines = (raw ?? "").split(/\r?\n/);

  const items: { id: string; title: string }[] = [];
  const out: string[] = [];

  // supports:
  // 1) type: toc <Hello>
  // 2) [[toc:Hello]]
  const reA = /^\s*type:\s*toc\s*<(.+?)>\s*$/i;
  const reB = /^\s*\[\[\s*toc\s*:\s*(.+?)\s*\]\]\s*$/i;

  const used = new Set<string>();

  for (const line of lines) {
    const m1 = line.match(reA);
    const m2 = line.match(reB);

    if (m1 || m2) {
      const title = (m1?.[1] ?? m2?.[1] ?? "").trim();
      const base = safeSlug(title) || "section";
      let id = base;
      let c = 1;
      while (used.has(id)) {
        id = `${base}-${c}`;
        c += 1;
      }
      used.add(id);
      items.push({ id, title });

      // inject visible heading in post body
      out.push(`<h2 id="${id}" class="postAutoHeading">${escapeHtml(title)}</h2>`);
      continue;
    }

    // keep as paragraph / blank lines
    if (!line.trim()) {
      out.push("");
    } else {
      out.push(`<p>${escapeHtml(line)}</p>`);
    }
  }

  const html = out.join("\n");
  return { html, items };
}

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
