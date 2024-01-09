import { ActionStep, IActionInputs, IBuildInput, IDeployInput, IPushInput } from './types'
import * as core from '@actions/core'

const getBuildInputs = (): IBuildInput => {
  const tag = core.getInput('tag')

  return {
    tag,
  }
}

const getPushInputs = (): IPushInput => {
  const username = process.env.DOCKERHUB_USERNAME
  if (!username) {
    core.error(
      'No username provided and no DockerHub username found in DOCKERHUB_USERNAME environment variable!',
    )
    throw new Error(
      'No username provided and no DockerHub username found in DOCKERHUB_USERNAME environment variable!',
    )
  }

  const password = process.env.DOCKERHUB_PASSWORD
  if (!password) {
    core.error(
      'No password provided and no DockerHub password found in DOCKERHUB_PASSWORD environment variable!',
    )
    throw new Error(
      'No password provided and no DockerHub password found in DOCKERHUB_PASSWORD environment variable!',
    )
  }

  return {
    dockerUsername: username,
    dockerPassword: password,
  }
}

const getDeployIUputs = (): IDeployInput => {
  const services = getInputList('services')

  return {
    services,
  }
}

export const loadInputs = async (): Promise<IActionInputs> => {
  const actionSteps = getInputList('steps') as ActionStep[]

  if (actionSteps.length === 0) {
    core.error('No action steps provided!')
    throw new Error('No action steps provided!')
  }

  const results: IActionInputs = {
    steps: actionSteps,
  }

  for (const step of actionSteps) {
    switch (step) {
      case ActionStep.BUILD:
        results[ActionStep.BUILD] = getBuildInputs()
        break
      case ActionStep.PUSH:
        results[ActionStep.PUSH] = getPushInputs()
        break
      case ActionStep.DEPLOY:
        results[ActionStep.DEPLOY] = getDeployIUputs()
        break

      default:
        core.error(`Unknown action step: ${step}!`)
        throw new Error(`Unknown action step: ${step}!`)
    }
  }

  return results
}

const getInputList = (name: string): string[] => {
  const items = core.getInput(name)
  return items
    .split(' ')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}
