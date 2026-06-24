import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const sourceDir = process.argv[2] ?? "pages-dist";
const destinationDir = normalizeDestination(process.argv[3] ?? ".");
const worktreeDir = ".pages-worktree";
const repository = requireEnv("GITHUB_REPOSITORY");
const token = requireEnv("GITHUB_TOKEN");
const remoteUrl = `https://x-access-token:${token}@github.com/${repository}.git`;

if (!existsSync(sourceDir)) {
  throw new Error(`Pages source directory does not exist: ${sourceDir}`);
}

rmSync(worktreeDir, { recursive: true, force: true });
cloneOrCreatePagesBranch(worktreeDir, remoteUrl);

if (destinationDir === ".") {
  for (const entry of ["index.html", "platform-web", "dist", ".nojekyll"]) {
    rmSync(join(worktreeDir, entry), { recursive: true, force: true });
  }
  cpSync(sourceDir, worktreeDir, { recursive: true });
} else {
  const targetDir = join(worktreeDir, destinationDir);
  rmSync(targetDir, { recursive: true, force: true });
  mkdirSync(targetDir, { recursive: true });
  cpSync(sourceDir, targetDir, { recursive: true });
}

run("git", ["-C", worktreeDir, "add", "-A"]);

if (hasNoChanges(worktreeDir)) {
  console.log(`No GitHub Pages changes for destination: ${destinationDir}`);
  process.exit(0);
}

run("git", ["-C", worktreeDir, "config", "user.name", "github-actions[bot]"]);
run("git", ["-C", worktreeDir, "config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"]);
run("git", ["-C", worktreeDir, "commit", "-m", `deploy pages: ${destinationDir}`]);
run("git", ["-C", worktreeDir, "push", "origin", "gh-pages"]);

console.log(`GitHub Pages deployed to gh-pages:${destinationDir}`);

function normalizeDestination(value) {
  const normalized = value.replace(/^\/+|\/+$/g, "");
  return normalized.length === 0 ? "." : normalized;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function cloneOrCreatePagesBranch(targetDir, remote) {
  try {
    run("git", ["clone", "--depth", "1", "--branch", "gh-pages", remote, targetDir]);
    return;
  } catch {
    mkdirSync(targetDir, { recursive: true });
    run("git", ["-C", targetDir, "init"]);
    run("git", ["-C", targetDir, "remote", "add", "origin", remote]);
    run("git", ["-C", targetDir, "checkout", "--orphan", "gh-pages"]);
  }
}

function hasNoChanges(targetDir) {
  const output = execFileSync("git", ["-C", targetDir, "status", "--porcelain"], { encoding: "utf8" });
  return output.trim().length === 0;
}

function run(command, args) {
  execFileSync(command, args, { stdio: "inherit" });
}
