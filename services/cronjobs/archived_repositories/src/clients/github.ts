import { ofetch } from 'ofetch';
import { Config } from "../config";

export async function isGitHubRepoArchived(url: string, config: Config): Promise<boolean> {
  const parsed = new URL(url);
  const parts = parsed.pathname.split('/').filter(Boolean);

  if (parts.length < 2) {
    throw new Error(`Invalid GitHub repository URL: ${url}`);
  }

  const [owner, repo] = parts;

  const data = await ofetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      Authorization: `Bearer ${config.GithubToken}`,
      Accept: 'application/vnd.github+json',
    },
  });

  return data.archived;
}
