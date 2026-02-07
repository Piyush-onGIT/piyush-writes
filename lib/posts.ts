import fs from "fs/promises";
import path from "path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import { rehypeMermaidBlocks } from "@/utils/mermaidConverter";

export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
};

export type Post = {
  meta: PostMeta;
  content: string;
};

const postsDir = path.join(process.cwd(), "content", "blogs");

const fallbackMeta: PostMeta = {
  slug: "",
  title: "Untitled",
  description: "",
  date: new Date().toISOString(),
};

function parseFrontMatter(raw: string): Post {
  if (!raw.startsWith("---")) {
    return { meta: fallbackMeta, content: raw.trim() };
  }

  const end = raw.indexOf("---", 3);
  if (end === -1) {
    return { meta: fallbackMeta, content: raw.trim() };
  }

  const frontMatter = raw.slice(3, end).trim();
  const content = raw.slice(end + 3).trim();

  const meta: Record<string, string> = {};
  for (const line of frontMatter.split("\n")) {
    const [key, ...rest] = line.split(":");
    if (!key || rest.length === 0) continue;
    meta[key.trim()] = rest.join(":").trim();
  }

  return {
    meta: {
      slug: meta.slug || "",
      title: meta.title || fallbackMeta.title,
      description: meta.description || fallbackMeta.description,
      date: meta.date || fallbackMeta.date,
    },
    content,
  };
}

export async function getAllPosts(): Promise<PostMeta[]> {
  const files = await fs.readdir(postsDir);

  const posts = await Promise.all(
    files
      .filter((file) => file.endsWith(".md"))
      .map(async (file) => {
        const raw = await fs.readFile(path.join(postsDir, file), "utf-8");
        const parsed = parseFrontMatter(raw);
        return {
          ...parsed.meta,
          slug: file.replace(/\.md$/, ""),
        } satisfies PostMeta;
      })
  );

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getPostBySlug(slug: string): Promise<Post> {
  const decodedSlug = decodeURIComponent(slug);
  const target = path.join(postsDir, `${decodedSlug}.md`);
  const raw = await fs.readFile(target, "utf-8");
  const parsed = parseFrontMatter(raw);
  return {
    meta: { ...parsed.meta, slug: decodedSlug },
    content: parsed.content,
  };
}

export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeHighlight)
    .use(rehypeStringify)
    .use(rehypeMermaidBlocks)
    .process(markdown);
  return result.toString();
}
