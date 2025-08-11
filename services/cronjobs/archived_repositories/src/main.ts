import { Queue } from 'bullmq';
import { getConfig, Config } from './config.js';
import { closeConnection, fetchRepositoryUrls } from './database.js';
import { parseRepoURL } from './utils';
import { GITHUB_QUEUE_NAME, GITLAB_QUEUE_NAME } from './types';
import { JobData, ParsedRepoInfo, Platform } from './types.js';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main(config: Config) {
  let totalProcessed = 0;
  let batchNumber = 1;

  const queueOptions = { connection: { url: config.RedisUrl } };
  const githubQueue = new Queue(GITHUB_QUEUE_NAME, queueOptions);
  const gitlabQueue = new Queue(GITLAB_QUEUE_NAME, queueOptions);

  console.log(`Starting batch processing with batch size: ${config.BatchSize}, delay: ${config.BatchDelayMs}ms`);

  while (true) {
    console.log(`Processing batch ${batchNumber}...`);

    const repoURLs = await fetchRepositoryUrls(config.BatchSize, config);

    if (repoURLs.length === 0) {
      console.log(`No more repositories found. Total processed: ${totalProcessed} repositories.`);
      break;
    }

    const { githubJobs, gitlabJobs } = prepareJobsByPlatform(repoURLs);
    let skippedCount = 0;

    // Add jobs to their respective queues
    if (githubJobs.length > 0) {
      await githubQueue.addBulk(githubJobs);
      console.log(`Enqueued ${githubJobs.length} GitHub repos`);
    }

    if (gitlabJobs.length > 0) {
      await gitlabQueue.addBulk(gitlabJobs);
      console.log(`Enqueued ${gitlabJobs.length} GitLab repos`);
    }

    const processedInBatch = githubJobs.length + gitlabJobs.length;
    totalProcessed += processedInBatch;

    console.log(`Batch ${batchNumber}, ${processedInBatch} jobs enqueued, ${skippedCount} skipped. Total queued so far: ${totalProcessed}`);

    // If we got fewer repositories than the batch size, we've reached the end
    if (repoURLs.length < config.BatchSize) {
      console.log(`Reached end of repositories list. Final total: ${totalProcessed} repositories.`);
      break;
    }

    console.log(`Waiting ${config.BatchDelayMs}ms before next batch...`);
    await sleep(config.BatchDelayMs);

    batchNumber++;
  }

  await closeConnection();
}

function prepareJobsByPlatform(repoURLs: string[]): { githubJobs: JobData[]; gitlabJobs: JobData[] } {
  const githubJobs: JobData[] = [];
  const gitlabJobs: JobData[] = [];

  let parsedResult: ParsedRepoInfo;
  repoURLs.forEach((url) => {
    try {
      parsedResult = parseRepoURL(url);
    } catch (error) {
      console.warn(`Skipping URL due to error: ${error}`);
      return;
    }

    const jobData = {
      name: `${parsedResult.platform}-repo-${parsedResult.owner}-${parsedResult.repo}`,
      data: {
        url,
        platform: parsedResult.platform,
      },
    };

    switch (parsedResult.platform) {
      case Platform.GITHUB:
        githubJobs.push(jobData);
        break;
      case Platform.GITLAB:
        gitlabJobs.push(jobData);
        break;
    }
  });

  return { githubJobs, gitlabJobs };
}

if (require.main === module) {
  const config = getConfig();

  main(config).catch(error => {
    console.error('Error in main execution:', error);
    process.exit(1);
  });
}
