# AGENTS.md - mcp-server

This file gives repository-level guidance for Codex automatic PR reviews and other AI agents.

## Scope

Applies only to `mcp-server/`.

## Ecosystem role

- `mcp-server/` is the Turtleand knowledge MCP server and retrieval interface.
- This is an infrastructure and code repository, not a public essay surface.
- Its job is to expose Turtleand knowledge reliably through stable schemas, indexing behavior, package boundaries, and tool responses.
- Keep changes focused on retrieval correctness, build reliability, operational safety, and maintainable TypeScript.
- Route content strategy to the relevant surface repositories. Route public essays to Growth, curriculum to AI Lab, engineering writing to Build, and operational Hermes notes to Hermes Lab.

## Project summary

- Stack: TypeScript, MCP SDK, Zod
- Status: Active
- Primary code: `src/`
- Index generation: `scripts/build-index.ts`
- Built output: `dist/`

## Workflow

1. Read `README.md`, `package.json`, and nearby code before larger changes.
2. Prefer source edits under `src/` and scripts under `scripts/`.
3. Treat retrieval schemas, tool names, response shapes, and package boundaries as compatibility-sensitive.
4. Do not hand-edit `dist/` unless the repository policy explicitly requires committed build output.

## Public-safety review

Reject changes that expose secrets, credentials, private infrastructure details, internal paths, unsafe logging, specific vulnerabilities, operational weaknesses, or brittle assumptions about local environment. Safe public lessons are allowed when they describe general patterns, architecture trade-offs, defensive principles, or non-sensitive implementation choices.

Keep private things private. Share learnings, not exposure.

## Code quality review

- Preserve reliable indexing, retrieval behavior, schemas, package boundaries, and build outputs.
- Check error handling, logging, input validation, and Zod schemas for safety and clarity.
- Avoid adding hardcoded local paths, hidden environment assumptions, excessive logs, or private data to generated indexes.
- Keep public claims and README changes grounded and non-hype.
- Preserve Turtleand voice where documentation is touched: calm, precise, direct, reflective when useful, practical when needed.
- Do not introduce em dashes in public writing.
- Keep humans responsible for direction, judgment, taste, ethics, and consequences.

## Repository integrity review

- Keep changes focused to the branch purpose.
- Do not silently modify generated or build output unless the repo explicitly tracks it or the change requires regeneration.
- Require build verification for code changes.
- Require index-generation verification when indexing behavior, data inputs, or generated retrieval content changes.
- Keep schemas, package metadata, and documentation aligned.

## PR review checklist

Codex and other agents should check:

- Does the change strengthen the MCP server as a reliable retrieval interface?
- Are schema, indexing, and response-shape changes intentional and documented?
- Is anything private, unsafe, or operationally sensitive exposed?
- Are logging and errors safe for public or shared environments?
- Are build outputs, generated indexes, and package boundaries still correct?
- Is the diff small, coherent, and free from unrelated cleanup?

## Commands

- Install: `npm install`
- Build: `npm run build`
- Build index: `npm run build-index`
- Start: `npm run start`
