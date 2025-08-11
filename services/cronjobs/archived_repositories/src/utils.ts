import { Platform } from "./types";
import type { ParsedRepoInfo } from "./types";

/*
  * Parses a repository URL and returns the platform, owner, and repo name.
  * This expects URLs in the format that are typical for GitHub and GitLab,
  * e.g.: https://github.com/linuxfoundation/insights
  * If in the future we need to support more platforms, we might need to revisit this.
 */
export function parseRepoURL(url: string): ParsedRepoInfo {
  const parsed = new URL(url);
  const parts = parsed.pathname.split('/').filter(Boolean);

  if (parts.length < 2) {
    throw new Error(`Invalid repository URL: ${url}`);
  }

  const [owner, repo] = parts;

  if (parsed.hostname.includes('github.com')) {
    return { platform: Platform.GITHUB, owner, repo };
  } else if (parsed.hostname.includes('gitlab.com')) {
    return { platform: Platform.GITLAB, owner, repo };
  }

  throw new Error(`Unsupported platform for URL: ${url}`);
}
