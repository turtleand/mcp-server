import { writeFileSync } from "fs";
import { readMarkdownFiles } from "./content-files.js";
import { basename, join, resolve } from "path";
import { fileURLToPath } from "url";

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

export function buildArticles(inputSources = sources): Article[] {
  const articles: Article[] = [];

  for (const src of inputSources) {
    for (const { file, content } of readMarkdownFiles(src.dir, src.ext)) {
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

  return articles;
}

export function writeIndex(output: string, inputSources = sources): number {
  const articles = buildArticles(inputSources);
  writeFileSync(output, JSON.stringify(articles, null, 2));
  return articles.length;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const count = writeIndex(join(import.meta.dirname!, "../src/content-index.json"));
    console.log(`Indexed ${count} articles`);
  } catch {
    console.error("Index build failed. Check the configured source directories, article files and output permissions.");
    process.exitCode = 1;
  }
}
