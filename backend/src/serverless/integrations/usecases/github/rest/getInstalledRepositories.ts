import axios, { AxiosRequestConfig } from 'axios'
import { createServiceChildLogger } from '../../../../../utils/logging'
import { Repos } from '../../../types/regularTypes'

const log = createServiceChildLogger('getInstalledRepositories')

export const getInstalledRepositories = async (installToken: string): Promise<Repos> => {
  try {
    const requestConfig = {
      method: 'get',
      url: `https://api.github.com/installation/repositories`,
      headers: {
        Authorization: `Bearer ${installToken}`,
      },
    } as AxiosRequestConfig
    const response = await axios(requestConfig)
    const data = response.data
    const repos: Repos = []

    if (data.repositories) {
      for (const repo of data.repositories) {
        repos.push({
          url: repo.html_url,
          owner: repo.owner.login,
          createdAt: repo.created_at,
          name: repo.name,
        })
      }
      return repos
    }

    return []
  } catch (err: any) {
    log.error(err, 'Error fetching installed repositories!')
    throw err
  }
}
