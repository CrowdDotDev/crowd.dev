import { ofetch } from 'ofetch';
import { Config } from "../config";

export async function isGitLabRepoArchived(url: string, config: Config): Promise<boolean> {
  const parsed = new URL(url);
  const projectPath = parsed.pathname.split('/').filter(Boolean).join('/');

  if (!projectPath) {
    throw new Error(`Invalid GitLab repository URL: ${url}`);
  }

  const encodedProjectPath = encodeURIComponent(projectPath);
  const data = await ofetch(`https://gitlab.com/api/v4/projects/${encodedProjectPath}`, {
    headers: { 'PRIVATE-TOKEN': config.GitlabToken },
  });

  return data.archived;
}
