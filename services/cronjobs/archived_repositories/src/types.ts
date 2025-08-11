export const GITHUB_QUEUE_NAME = 'github-archived-repo-checker';
export const GITLAB_QUEUE_NAME = 'gitlab-archived-repo-checker';

export enum Platform {
  GITHUB = 'github',
  GITLAB = 'gitlab',
}

export interface ParsedRepoInfo {
  platform: Platform.GITHUB | Platform.GITLAB;
  owner: string;
  repo: string;
}

export interface JobData {
  name: string;
  data: {
    url: string,
    platform: Platform.GITHUB | Platform.GITLAB,
  };
}
