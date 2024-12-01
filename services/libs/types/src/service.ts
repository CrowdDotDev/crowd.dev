export interface IServiceConfig {
  edition: string
}

export enum ServiceEnvironment {
  DEVELOPMENT = 'development',
  DOCKER = 'docker',
  PRODUCTION = 'production',
  STAGING = 'staging',
  TEST = 'test',
}
