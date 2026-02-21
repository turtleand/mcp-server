import { readFileSync, readdirSync, writeFileSync } from "fs";
import { basename, join } from "path";

interface Article {
  slug: string;
  title: string;
  summary: string;
  source: string;
  module: string;
  tags: string[];
  body: string;
  url: string;
}

const sources = [
  { dir: `${process.env.HOME}/projects/ai-lab/src/content/topics`, ext: ".mdx", source: "ai-lab", urlBase: "https://lab.turtleand.com/topics/" },
  { dir: `${process.env.HOME}/projects/turtleand-blog/src/content/blog`, ext: ".md", source: "blog", urlBase: "https://growth.turtleand.com/posts/" },
  { dir: `${process.env.HOME}/projects/openclaw-lab/src/content/topics`, ext: ".mdx", source: "openclaw-lab", urlBase: "https://openclaw.turtleand.com/topics/" },
  { dir: `${process.env.HOME}/projects/build/src/content/posts`, ext: ".md", source: "build", urlBase: "https://build.turtleand.com/posts/" },
];

function parseFrontmatter(content: string): { meta: Record<string, any>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };
  const meta: Record<string, any> = {};
  let currentKey = "";
  let inArray = false;
  for (const line of match[1].split("\n")) {
    if (inArray) {
      const item = line.match(/^\s+-\s+(.+)/);
      if (item) {
        const val = item[1].replace(/^["']|["']$/g, "");
        (meta[currentKey] as string[]).push(val);
        continue;
      }
      inArray = false;
    }
    const kv = line.match(/^(\w[\w-]*):\s*(.*)/);
    if (kv) {
      currentKey = kv[1];
      const val = kv[2].trim();
      if (val === "") {
        // might be array
        meta[currentKey] = [];
        inArray = true;
      } else {
        meta[currentKey] = val.replace(/^["']|["']$/g, "");
      }
    }
  }
  return { meta, body: match[2] };
}

const articles: Article[] = [];

for (const src of sources) {
  let files: string[];
  try {
    files = readdirSync(src.dir).filter(f => f.endsWith(src.ext));
  } catch {
    console.warn(`Skipping ${src.dir} (not found)`);
    continue;
  }
  for (const file of files) {
    const content = readFileSync(join(src.dir, file), "utf-8");
    const { meta, body } = parseFrontmatter(content);
    if (meta.draft === "true") continue;
    const slug = basename(file, src.ext);
    articles.push({
      slug,
      title: meta.title || slug,
      summary: meta.summary || meta.description || "",
      source: src.source,
      module: meta.module || "",
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      body,
      url: src.urlBase + slug,
    });
  }
}

writeFileSync(join(import.meta.dirname!, "../src/content-index.json"), JSON.stringify(articles, null, 2));
console.log(`Indexed ${articles.length} articles`);
