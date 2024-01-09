export enum ActionStep {
  BUILD = 'build',
  PUSH = 'push',
  DEPLOY = 'deploy',
}

export interface IBuildInput {
  // image version tag
  tag: string

  // images to build
  images: string[]
}

export interface IPushInput {
  // docker credentials to push image to
  dockerUsername: string
  dockerPassword: string
}

export interface IDeployInput {
  // services to deploy
  services: string[]
}

export interface IBuilderDefinition {
  imageName: string
  dockerRepository: string
  services: string[]
  prioritizedServices: string[]
}

export type IActionInputs = {
  steps: ActionStep[]
  [ActionStep.BUILD]?: IBuildInput
  [ActionStep.PUSH]?: IPushInput
  [ActionStep.DEPLOY]?: IDeployInput
}
