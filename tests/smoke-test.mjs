import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = join(__dirname, "..", "dist", "index.js");

let passed = 0, failed = 0;
function test(name, ok) {
  if (ok) { console.log(`✅ PASS: ${name}`); passed++; }
  else { console.log(`❌ FAIL: ${name}`); failed++; }
}

async function rpc(proc, msg) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout on id=${msg.id}`)), 5000);
    let buf = "";
    const handler = (chunk) => {
      buf += chunk.toString();
      const lines = buf.split("\n");
      buf = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.id === msg.id) {
            clearTimeout(timer);
            proc.stdout.removeListener("data", handler);
            resolve(parsed);
          }
        } catch {}
      }
    };
    proc.stdout.on("data", handler);
    proc.stdin.write(JSON.stringify(msg) + "\n");
  });
}

const proc = spawn("node", [serverPath], { stdio: ["pipe", "pipe", "pipe"] });

try {
  // 1. Initialize
  const init = await rpc(proc, { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "1.0" } } });
  test("initialize returns capabilities with tools", init?.result?.capabilities?.tools != null);

  // Send initialized notification (no response expected)
  proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  await new Promise(r => setTimeout(r, 200));

  // 2. tools/list
  const tools = await rpc(proc, { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
  const names = tools?.result?.tools?.map(t => t.name).sort();
  test("tools/list returns 2 tools", names?.length === 2 && names[0] === "get-article" && names[1] === "search-articles");

  // 3. search
  const search = await rpc(proc, { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "search-articles", arguments: { query: "AI" } } });
  const results = JSON.parse(search?.result?.content?.[0]?.text || "[]");
  test("search-articles returns results for 'AI'", results.length > 0);

  // 4. get-article valid
  const article = await rpc(proc, { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "get-article", arguments: { slug: "access-secrets" } } });
  const text = article?.result?.content?.[0]?.text || "";
  test("get-article returns body for valid slug", text.length > 100);

  // 5. get-article invalid
  const nf = await rpc(proc, { jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "get-article", arguments: { slug: "nonexistent-xyz" } } });
  test("get-article returns 'not found' for invalid slug", (nf?.result?.content?.[0]?.text || "").includes("not found"));

} catch (e) {
  console.error("Error:", e.message);
  failed++;
} finally {
  proc.kill();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
