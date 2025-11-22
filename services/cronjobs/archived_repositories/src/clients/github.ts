import { ofetch } from 'ofetch'

import { Config } from '../config'
import { RepositoryStatus } from '../types'

export async function getGithubRepoStatus(url: string, config: Config): Promise<RepositoryStatus> {
  const parsed = new URL(url)
  const parts = parsed.pathname.split('/').filter(Boolean)

  if (parts.length < 2) {
    throw new Error(`Invalid GitHub repository URL: ${url}`)
  }

  const [owner, repo] = parts

  try {
    const data = await ofetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${config.GithubToken}`,
        Accept: 'application/vnd.github+json',
      },
    })

    return {
      archived: data.archived,
      excluded: false,
    }
  } catch (error: any) {
    // Handle 404 (not found) and 403 (forbidden) as excluded repositories
    if (error?.status === 404 || error?.status === 403) {
      console.log(`GitHub repo not accessible (${error.status}): ${url} - marking as excluded`)
      return {
        archived: false,
        excluded: true,
      }
    }

    // Re-throw other errors to maintain existing error handling
    throw error
  }
}
