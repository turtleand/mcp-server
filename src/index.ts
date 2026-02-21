#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import type { Article } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const articles: Article[] = JSON.parse(
  readFileSync(join(__dirname, "content-index.json"), "utf-8")
);

const server = new McpServer({
  name: "@turtleand/mcp-server",
  version: "0.1.0",
});

server.tool(
  "search-articles",
  "Search Turtleand knowledge base articles by keyword",
  { query: z.string().describe("Search query") },
  async ({ query }) => {
    const terms = query.toLowerCase().split(/\s+/);
    const scored = articles.map((a) => {
      const haystack = `${a.title} ${a.summary} ${a.tags.join(" ")} ${a.body}`.toLowerCase();
      const score = terms.reduce((s, t) => s + (haystack.includes(t) ? 1 : 0), 0);
      return { a, score };
    });
    const results = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((s) => ({
        slug: s.a.slug,
        title: s.a.title,
        summary: s.a.summary,
        source: s.a.source,
        url: s.a.url,
      }));
    return {
      content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }],
    };
  }
);

server.tool(
  "get-article",
  "Get full article content by slug",
  { slug: z.string().describe("Article slug") },
  async ({ slug }) => {
    const article = articles.find((a) => a.slug === slug);
    if (!article) {
      return {
        content: [{ type: "text" as const, text: "Article not found" }],
        isError: true,
      };
    }
    return {
      content: [
        {
          type: "text" as const,
          text: `# ${article.title}\n\nSource: ${article.source} | ${article.url}\nTags: ${article.tags.join(", ")}\n\n${article.body}`,
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
