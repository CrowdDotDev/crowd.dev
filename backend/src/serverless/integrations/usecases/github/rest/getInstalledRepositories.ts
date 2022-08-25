import axios, { AxiosRequestConfig } from 'axios'
import { Repos } from '../../../types/regularTypes'

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
    console.log(err)
    throw err
  }
}
