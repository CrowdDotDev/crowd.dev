import { Worker, Job, WorkerOptions } from 'bullmq';
import { getConfig } from './config.js';
import { isGitHubRepoArchived } from './clients/github';
import { isGitLabRepoArchived } from './clients/gitlab';
import { parseRepoURL } from "./utils";
import { GITHUB_QUEUE_NAME, GITLAB_QUEUE_NAME, Platform } from './types';
import { updateRepositoryStatus } from "./database";

const config = getConfig();

const redis = { connection: { url: config.RedisUrl } };

async function handleJob(job: Job) {
  if (!job.data || !job.data.url) {
    throw new Error('Job data must contain a valid URL');
  }

  const parseResult = parseRepoURL(job.data.url);

  let archived;
  switch (job.data.platform) {
    case Platform.GITHUB:
      console.log(`Processing GitHub repo: ${parseResult.owner}/${parseResult.repo}`);
      archived = await isGitHubRepoArchived(parseResult.owner, parseResult.repo, config);
      break;
    case Platform.GITLAB:
      console.log(`Processing GitLab repo: ${parseResult.owner}/${parseResult.repo}`);
      archived = await isGitLabRepoArchived(parseResult.owner, parseResult.repo, config);
      break;
    default:
      throw new Error(`Unsupported platform: ${job.data.platform}`);
  }

  // Now update the database table with the result
  await updateRepositoryStatus(job.data.url, archived, config)
}

// TODO: make this configurable via environment variables
// The rate limits for GitHub and GitLab are different, so we need to set different limiters for each worker.
// GitHub allows 5000 requests per hour (for authenticated requests), while GitLab allows 2000 requests per minute.
// See the rate limits here:
// * https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28
// * https://docs.gitlab.com/user/gitlab_com/#rate-limits-on-gitlabcom
//
// The `max` parameter below is the maximum number of jobs that can be processed in the `duration` period.
// Conversely, the `duration` parameter is the time period in milliseconds during which the `max` number
// of jobs can be processed. If the limit is reached, the worker will pause until the next period starts.
const githubWorkerOptions: WorkerOptions = {
  ...redis,
  concurrency: 5,
  limiter: {
    max: 5000,
    duration: 3600000
  },
};

const gitlabWorkerOptions: WorkerOptions = {
  ...redis,
  concurrency: 5,
  limiter: {
    max: 2000,
    duration: 60000
  },
};

// Both workers share the same job handler but they need different limiters due to the different rate limits of GitHub and GitLab APIs.
const githubWorker = new Worker(GITHUB_QUEUE_NAME, handleJob, githubWorkerOptions);
const gitlabWorker = new Worker(GITLAB_QUEUE_NAME, handleJob, gitlabWorkerOptions);

githubWorker.on('failed', (job, err) => {
  console.error(`GitHub job ${job?.id || 'unknown'} has failed with message: ${err}, ${err.stack}`);
});

gitlabWorker.on('failed', (job, err) => {
  console.error(`GitLab job ${job?.id || 'unknown'} has failed with message: ${err}, ${err.stack}`);
})

// TODO: Check if there are event listeners for when we hit the rate limit, and log that, as well as for resume.

export { githubWorker, gitlabWorker };
