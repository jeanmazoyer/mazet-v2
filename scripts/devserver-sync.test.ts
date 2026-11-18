import { execFileSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

// devserver-sync.sh runs unattended every minute on the box that also serves production, so its
// two decisions are pinned against real git repositories: when to move the checkout forward, and
// when a change needs the container restarted (dependencies and migrations are only applied at
// container start; plain source changes are picked up live by `next dev`).
const SCRIPT = path.resolve("scripts/devserver-sync.sh");

let root: string;
let checkout: string;
let author: string;
let dockerLog: string;
let env: NodeJS.ProcessEnv;

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd, env, encoding: "utf8" }).trim();
}

function commitFile(repo: string, file: string, content: string): void {
  mkdirSync(path.dirname(path.join(repo, file)), { recursive: true });
  writeFileSync(path.join(repo, file), content);
  git(repo, "add", "-A");
  git(repo, "commit", "-q", "-m", `change ${file}`);
}

function publish(file: string, content: string): void {
  commitFile(author, file, content);
  git(author, "push", "-q", "origin", "HEAD");
}

function sync(): void {
  execFileSync("sh", [path.join(checkout, "scripts/devserver-sync.sh")], { env });
}

function dockerCalls(): string[] {
  return existsSync(dockerLog) ? readFileSync(dockerLog, "utf8").trim().split("\n") : [];
}

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), "devsync-"));
  const bin = path.join(root, "bin");
  dockerLog = path.join(root, "docker.log");
  mkdirSync(bin);
  // Stands in for docker: records how it was called instead of touching any container.
  writeFileSync(path.join(bin, "docker"), `#!/bin/sh\necho "$*" >> "${dockerLog}"\n`);
  chmodSync(path.join(bin, "docker"), 0o755);
  env = {
    NODE_ENV: "test",
    PATH: `${bin}:/usr/local/bin:/usr/bin:/bin`,
    HOME: root,
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_SYSTEM: "/dev/null",
    GIT_AUTHOR_NAME: "t",
    GIT_AUTHOR_EMAIL: "t@example.test",
    GIT_COMMITTER_NAME: "t",
    GIT_COMMITTER_EMAIL: "t@example.test",
  };

  const remote = path.join(root, "remote.git");
  author = path.join(root, "author");
  checkout = path.join(root, "checkout");
  git(root, "init", "-q", "--bare", "-b", "main", remote);
  git(root, "clone", "-q", remote, author);
  mkdirSync(path.join(author, "scripts"));
  copyFileSync(SCRIPT, path.join(author, "scripts/devserver-sync.sh"));
  commitFile(author, "src/page.tsx", "one");
  git(author, "push", "-q", "origin", "HEAD:main");
  git(root, "clone", "-q", remote, checkout);
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("devserver-sync.sh", () => {
  test("does nothing when the branch has not moved", () => {
    const before = git(checkout, "rev-parse", "HEAD");
    sync();
    expect(git(checkout, "rev-parse", "HEAD")).toBe(before);
    expect(dockerCalls()).toEqual([]);
  });

  test("pulls a source change without restarting the container", () => {
    publish("src/page.tsx", "two");
    sync();
    expect(readFileSync(path.join(checkout, "src/page.tsx"), "utf8")).toBe("two");
    expect(dockerCalls()).toEqual([]);
  });

  test.each([
    ["the lockfile", "domaine/package-lock.json"],
    ["the dependencies", "domaine/package.json"],
    ["the compose file", "domaine/docker-compose.yml"],
  ])("restarts the container when %s changes", (_label, file) => {
    publish(file, "changed");
    sync();
    expect(dockerCalls()).toEqual([
      "compose -p mazet-dev -f domaine/docker-compose.yml up -d --force-recreate",
    ]);
  });

  test("leaves the checkout alone when it cannot fast-forward", () => {
    commitFile(checkout, "src/local.ts", "local only");
    publish("src/page.tsx", "two");
    const before = git(checkout, "rev-parse", "HEAD");
    expect(() => sync()).toThrow();
    expect(git(checkout, "rev-parse", "HEAD")).toBe(before);
    expect(dockerCalls()).toEqual([]);
  });
});
