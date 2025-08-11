import { ofetch } from 'ofetch';
import { Config } from "../config";

export async function isGitHubRepoArchived(owner: string, repo: string, config: Config): Promise<boolean> {
  const data = await ofetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: { Authorization: `Bearer ${config.GithubToken}` },
  });

  console.log('GitHub API response:', data.archived);
  return data.archived;
}
