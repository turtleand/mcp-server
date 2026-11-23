import assert from "node:assert/strict";
import { linkSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { buildArticles, writeIndex } from "../scripts/build-index.js";
import { readMarkdownFiles } from "../scripts/content-files.js";

function fixture(run: (base: string, root: string) => void) {
  const base = mkdtempSync(join(realpathSync(tmpdir()), "content-index-"));
  const root = join(base, "content");
  mkdirSync(root);
  try { run(base, root); } finally { rmSync(base, { recursive: true, force: true }); }
}

test("indexes ordinary Markdown and MDX, preserves metadata and excludes drafts", () => fixture((_base, root) => {
  writeFileSync(join(root, "hello.md"), '---\ntitle: Hello\nsummary: Example\ntags:\n  - test\n---\nHarmless article.');
  writeFileSync(join(root, "draft.md"), '---\ndraft: true\n---\nUnpublished.');
  writeFileSync(join(root, "topic.mdx"), '---\ntitle: Topic\n---\nExample MDX.');
  writeFileSync(join(root, "ignored.txt"), "Not an article.");
  const articles = buildArticles([{ dir: join(root, "."), ext: ".md", source: "fixture", urlBase: "https://example.test/" }]);
  assert.equal(articles.length, 1);
  assert.deepEqual(articles[0], { slug: "hello", title: "Hello", summary: "Example", source: "fixture", module: "", tags: ["test"], body: "Harmless article.", url: "https://example.test/hello" });
  assert.equal(readMarkdownFiles(root, ".mdx")[0].file, "topic.mdx");
}));

test("rejects a Markdown symlink even when its target is in the content root", () => fixture((_base, root) => {
  writeFileSync(join(root, "sample.txt"), "Inert fixture.");
  symlinkSync("sample.txt", join(root, "linked.md"));
  assert.throws(() => readMarkdownFiles(root, ".md"));
}));

test("rejects canonical paths outside the content root", () => fixture((base, root) => {
  writeFileSync(join(base, "sample.txt"), "Inert fixture.");
  symlinkSync(join(base, "sample.txt"), join(root, "linked.md"));
  assert.throws(() => readMarkdownFiles(root, ".md"));
}));

test("rejects a symlinked content root", () => fixture((base, root) => {
  const alias = join(base, "alias");
  symlinkSync(root, alias, "dir");
  assert.throws(() => readMarkdownFiles(alias, ".md"));
}));

test("rejects symlink ancestors of the content root", () => fixture((base, root) => {
  mkdirSync(join(root, "nested"));
  const alias = join(base, "alias");
  symlinkSync(root, alias, "dir");
  assert.throws(() => readMarkdownFiles(join(alias, "nested"), ".md"));
}));

test("rejects directories and broken links with Markdown names", () => fixture((_base, root) => {
  mkdirSync(join(root, "folder.md"));
  assert.throws(() => readMarkdownFiles(root, ".md"));
  symlinkSync("absent", join(root, "broken.mdx"));
  assert.throws(() => readMarkdownFiles(root, ".mdx"));
}));

test("fails closed on missing sources and unsupported extensions", () => fixture((_base, root) => {
  assert.throws(() => buildArticles([{ dir: join(root, "absent"), ext: ".md", source: "fixture", urlBase: "https://example.test/" }]));
  assert.throws(() => readMarkdownFiles(root, ".txt"));
}));

test("rejects a multiply linked article", () => fixture((_base, root) => {
  writeFileSync(join(root, "notes.txt"), "Inert fixture.");
  linkSync(join(root, "notes.txt"), join(root, "article.md"));
  assert.throws(() => readMarkdownFiles(root, ".md"), /single regular files/);
}));

test("an invalid later source does not replace a previously generated index", () => fixture((base, root) => {
  const source = { dir: root, ext: ".md", source: "fixture", urlBase: "https://example.test/" };
  const output = join(base, "index.json");
  writeFileSync(join(root, "hello.md"), "Ordinary article.");
  assert.equal(writeIndex(output, [source]), 1);
  const previous = readFileSync(output, "utf8");
  assert.equal(JSON.parse(previous)[0].body, "Ordinary article.");
  assert.throws(() => writeIndex(output, [source, { ...source, dir: join(base, "absent") }]));
  assert.equal(readFileSync(output, "utf8"), previous);
}));
