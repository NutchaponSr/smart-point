import "server-only";

import { execSync } from "node:child_process";

const GITHUB_REPO = {
  owner: "NutchaponSr",
  repo: "smart-point",
} as const;

type SemverBump = "major" | "minor" | "patch" | "none";

function classifyCommit(message: string): SemverBump {
  const firstLine = message.trim().split("\n")[0] ?? "";
  const isBreaking =
    /^\w+(?:\([^)]*\))?!:/.test(firstLine) ||
    /\bBREAKING[- ]CHANGE\b/i.test(message);

  if (isBreaking) {
    return "major";
  }

  const type = firstLine.match(/^(\w+)(?:\([^)]*\))?!?:/)?.[1]?.toLowerCase();
  if (type === "feat" || type === "feature") {
    return "minor";
  }
  if (type === "fix" || type === "bugfix") {
    return "patch";
  }

  return "none";
}

function toSemver(messages: string[]): string {
  let major = 0;
  let minor = 0;
  let patch = 0;

  for (const message of messages) {
    const bump = classifyCommit(message);
    if (bump === "major") {
      major += 1;
      minor = 0;
      patch = 0;
    } else if (bump === "minor") {
      minor += 1;
      patch = 0;
    } else if (bump === "patch") {
      patch += 1;
    }
  }

  return `${major}.${minor}.${patch}`;
}

function getLocalCommitMessages(): string[] | null {
  try {
    const raw = execSync("git log --reverse --format=%B%x1e", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });

    const messages = raw
      .split("\u001e")
      .map((message) => message.trim())
      .filter(Boolean);

    return messages.length > 0 ? messages : null;
  } catch {
    return null;
  }
}

async function getGitHubCommitMessages(): Promise<string[] | null> {
  const token = process.env.GITHUB_TOKEN;
  const messages: string[] = [];

  try {
    for (let page = 1; page <= 20; page += 1) {
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO.owner}/${GITHUB_REPO.repo}/commits?sha=main&per_page=100&page=${page}`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "smart-point",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          next: { revalidate: 300 },
          signal: AbortSignal.timeout(4000),
        },
      );

      if (!response.ok) {
        return null;
      }

      const commits = (await response.json()) as Array<{
        commit?: { message?: string };
      }>;

      if (!Array.isArray(commits) || commits.length === 0) {
        break;
      }

      for (const commit of commits) {
        const message = commit.commit?.message?.trim();
        if (message) {
          messages.push(message);
        }
      }

      if (commits.length < 100) {
        break;
      }
    }

    return messages.length > 0 ? messages.reverse() : null;
  } catch {
    return null;
  }
}

export async function getAppVersion(): Promise<string> {
  const messages =
    (await getGitHubCommitMessages()) ?? getLocalCommitMessages() ?? [];

  return toSemver(messages);
}
