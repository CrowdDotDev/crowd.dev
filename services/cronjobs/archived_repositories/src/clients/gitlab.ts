import { ofetch } from 'ofetch'

import { Config } from '../config'
import { RepositoryStatus } from '../types'

export async function getGitlabRepoStatus(url: string, config: Config): Promise<RepositoryStatus> {
  const parsed = new URL(url)
  const projectPath = parsed.pathname.split('/').filter(Boolean).join('/')

  if (!projectPath) {
    throw new Error(`Invalid GitLab repository URL: ${url}`)
  }

  const encodedProjectPath = encodeURIComponent(projectPath)

  try {
    const data = await ofetch(`https://gitlab.com/api/v4/projects/${encodedProjectPath}`, {
      headers: { 'PRIVATE-TOKEN': config.GitlabToken },
    })

    return {
      archived: data.archived,
      excluded: false,
    }
  } catch (error: any) {
    // Handle 404 (not found) and 403 (forbidden) as excluded repositories
    if (error?.status === 404 || error?.status === 403) {
      console.log(`GitLab repo not accessible (${error.status}): ${url} - marking as excluded`)
      return {
        archived: false,
        excluded: true,
      }
    }

    // Re-throw other errors to maintain existing error handling
    throw error
  }
}
