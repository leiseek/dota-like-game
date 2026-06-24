import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const destinationDir = normalizeDestination(process.argv[2] ?? "");
const worktreeDir = ".pages-worktree";
const repository = requireEnv("GITHUB_REPOSITORY");
const token = requireEnv("GITHUB_TOKEN");
const remoteUrl = `https://x-access-token:${token}@github.com/${repository}.git`;

if (!destinationDir || destinationDir === ".") {
  throw new Error("Refusing to remove the GitHub Pages root. Pass a preview destination like previews/pr-123.");
}

rmSync(worktreeDir, { recursive: true, force: true });

try {
  run("git", ["clone", "--depth", "1", "--branch", "gh-pages", remoteUrl, worktreeDir]);
} catch {
  console.log("No gh-pages branch exists yet; nothing to clean up.");
  process.exit(0);
}

const targetDir = join(worktreeDir, destinationDir);
if (!existsSync(targetDir)) {
  console.log(`Preview directory does not exist; nothing to clean up: ${destinationDir}`);
  process.exit(0);
}

rmSync(targetDir, { recursive: true, force: true });
run("git", ["-C", worktreeDir, "add", "-A"]);

if (hasNoChanges(worktreeDir)) {
  console.log(`No GitHub Pages cleanup changes for destination: ${destinationDir}`);
  process.exit(0);
}

run("git", ["-C", worktreeDir, "config", "user.name", "github-actions[bot]"]);
run("git", ["-C", worktreeDir, "config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"]);
run("git", ["-C", worktreeDir, "commit", "-m", `remove pages preview: ${destinationDir}`]);
run("git", ["-C", worktreeDir, "push", "origin", "gh-pages"]);

console.log(`GitHub Pages preview removed from gh-pages:${destinationDir}`);

function normalizeDestination(value) {
  const normalized = value.replace(/^\/+|\/+$/g, "");
  return normalized.length === 0 ? "." : normalized;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function hasNoChanges(targetDir) {
  const output = execFileSync("git", ["-C", targetDir, "status", "--porcelain"], { encoding: "utf8" });
  return output.trim().length === 0;
}

function run(command, args) {
  execFileSync(command, args, { stdio: "inherit" });
}
