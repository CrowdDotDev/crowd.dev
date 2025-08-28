import { ofetch } from 'ofetch';
import { Config } from "../config";

export async function isGitLabRepoArchived(owner: string, repo: string, config: Config): Promise<boolean> {
  const projectPath = encodeURIComponent(`${owner}/${repo}`);
  const data = await ofetch(`https://gitlab.com/api/v4/projects/${projectPath}`, {
    headers: { 'PRIVATE-TOKEN': config.GitlabToken },
  });

  return data.archived;
}
