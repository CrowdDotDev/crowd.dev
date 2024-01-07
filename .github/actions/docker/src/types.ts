export enum ActionSteps {
  BUILD = 'build',
  PUSH = 'push',
  DEPLOY = 'deploy',
}

export enum CloudEnvironment {
  PRODUCTION = 'production',
  STAGING = 'staging',
  LF_PRODUCTION = 'lf-production',
  LF_STAGING = 'lf-staging',
}

export interface IBuildInput {
  images: string[]
}

export interface IPushInput {
  username: string
  password: string
}

export interface IDeployInput {
  services: string[]
  cloudEnvironment: CloudEnvironment
  prioritized: boolean

  kubernetesClusterName: string
  awsRoleArn: string
  awsAccessKeyId: string
  awsSecretAccessKey: string
  awsRegion: string
}
