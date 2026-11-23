import { closeSync, constants, fstatSync, lstatSync, openSync, readdirSync, readFileSync, realpathSync, type BigIntStats } from "node:fs";
import { dirname, join, resolve } from "node:path";

function sameObject(a: BigIntStats, b: BigIntStats): boolean {
  return a.dev === b.dev && a.ino === b.ino;
}

function directoryInfo(path: string): BigIntStats {
  const info = lstatSync(path, { bigint: true });
  if (!info.isDirectory()) throw new Error("Content paths must contain only real directories");
  return info;
}

// Record directory identities from the filesystem root down, not just their names.
function snapshotRoot(root: string): () => void {
  const paths = [root];
  while (dirname(paths[0]) !== paths[0]) paths.unshift(dirname(paths[0]));
  const chain = paths.map(path => ({ path, initial: directoryInfo(path) }));
  if (realpathSync(root) !== root) throw new Error("Content root must be canonical");
  return () => {
    for (const { path, initial } of chain) {
      if (!sameObject(initial, directoryInfo(path))) throw new Error("Content directory changed");
    }
  };
}

function verifyFile(expected: BigIntStats, actual: BigIntStats): void {
  if (!actual.isFile() || actual.nlink !== 1n || !sameObject(expected, actual) ||
      expected.size !== actual.size || expected.ctimeNs !== actual.ctimeNs || expected.mtimeNs !== actual.mtimeNs) {
    throw new Error("Content input changed during indexing");
  }
}

export function readMarkdownFiles(directory: string, extension: string): { file: string; content: string }[] {
  if (extension !== ".md" && extension !== ".mdx") throw new Error("Unsupported content extension");
  if (!constants.O_NOFOLLOW) throw new Error("This platform does not support safe content-file opening");
  const root = resolve(directory);
  const verifyRoot = snapshotRoot(root);
  const names = readdirSync(root).filter(file => file.endsWith(extension)).sort();
  verifyRoot();

  return names.map(file => {
    const candidate = join(root, file);
    const initial = lstatSync(candidate, { bigint: true });
    if (!initial.isFile() || initial.nlink !== 1n || dirname(candidate) !== root || realpathSync(candidate) !== candidate) {
      throw new Error("Content inputs must be single regular files in the content directory");
    }
    const fd = openSync(candidate, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    try {
      verifyFile(initial, fstatSync(fd, { bigint: true }));
      verifyRoot();
      const content = readFileSync(fd, "utf8");
      verifyFile(initial, fstatSync(fd, { bigint: true }));
      verifyFile(initial, lstatSync(candidate, { bigint: true }));
      verifyRoot();
      return { file, content };
    } finally {
      closeSync(fd);
    }
  });
}
