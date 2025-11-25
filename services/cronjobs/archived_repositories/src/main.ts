import { Queue } from 'bullmq'

import { Config, getConfig } from './config.js'
import { closeConnection, fetchRepositoryUrls } from './database.js'
import { GITHUB_QUEUE_NAME, GITLAB_QUEUE_NAME } from './types'
import { JobData, Platform } from './types.js'

/**
 * Sets up the BullMQ queues for processing jobs for repository URLs, fetches all the URLs to be
 * processed from the database, and adds them to the respective queues.
 *
 * @param config An instance of a `Config` to be used by the main process.
 */
async function main(config: Config) {
  const queueOptions = {
    connection: { url: config.RedisUrl },
    defaultJobOptions: {
      attempts: 4,
      backoff: {
        type: 'exponential',
        delay: 3000,
        jitter: 0.5,
      },
    },
  }

  const githubQueue = new Queue(GITHUB_QUEUE_NAME, queueOptions)
  githubQueue.on('error', (err) => console.error('GitHub Queue Error:', err))

  const gitlabQueue = new Queue(GITLAB_QUEUE_NAME, queueOptions)
  gitlabQueue.on('error', (err) => console.error('GitLab Queue Error:', err))

  console.log(`Starting main cronjob to enqueue repository URLs`)

  const repoURLs = await fetchRepositoryUrls(config)

  if (repoURLs.length === 0) {
    console.log(`No repositories found, exiting.`)
    await Promise.all([githubQueue.close(), gitlabQueue.close()])
    await closeConnection()
    return
  }

  const { githubJobs, gitlabJobs } = prepareJobsByPlatform(repoURLs)

  // Add jobs to their respective queues
  if (githubJobs.length > 0) {
    await githubQueue.addBulk(githubJobs)
    githubJobs.forEach((job) => console.log(`Enqueued GitHub URL: ${job.data.url}`))
    console.log(`Enqueued ${githubJobs.length} GitHub repos`)
  }

  if (gitlabJobs.length > 0) {
    await gitlabQueue.addBulk(gitlabJobs)
    gitlabJobs.forEach((job) => console.log(`Enqueued Gitlab URL: ${job.data.url}`))
    console.log(`Enqueued ${gitlabJobs.length} GitLab repos`)
  }

  const totalProcessed = githubJobs.length + gitlabJobs.length

  console.log(`${totalProcessed} jobs enqueued.`)

  await Promise.all([githubQueue.close(), gitlabQueue.close()])
  await closeConnection()
}

/**
 * prepareJobsByPlatform receives a list of repository URLs to be added to job definitions for
 * processing by BullMQ. Supports GitHub and Gitlab, while other platforms will be logged and skipped.
 *
 * @param repoURLs The list of repository URLs.
 */
function prepareJobsByPlatform(repoURLs: string[]): {
  githubJobs: JobData[]
  gitlabJobs: JobData[]
} {
  const githubJobs: JobData[] = []
  const gitlabJobs: JobData[] = []

  repoURLs.forEach((url) => {
    let platform: Platform

    try {
      const parsed = new URL(url)

      switch (parsed.hostname) {
        case 'github.com':
          platform = Platform.GITHUB
          break
        case 'gitlab.com':
          platform = Platform.GITLAB
          break
        default:
          console.warn(`Skipping URL from unsupported platform: ${url}`)
          return
      }
    } catch (error) {
      console.warn(`Skipping URL due to error: ${error}`)
      return
    }

    const jobData = {
      name: `${platform}-repo-${url.replace(/[^a-zA-Z0-9]/g, '-')}`,
      data: {
        url,
        platform,
      },
      opts: {
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    }

    switch (platform) {
      case Platform.GITHUB:
        githubJobs.push(jobData)
        break
      case Platform.GITLAB:
        gitlabJobs.push(jobData)
        break
    }
  })

  return { githubJobs, gitlabJobs }
}

if (require.main === module) {
  const config = getConfig()

  main(config)
    .then(() => {
      console.log('Main finished successfully, exiting.')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Error in main execution:', error)
      process.exit(1)
    })
}
