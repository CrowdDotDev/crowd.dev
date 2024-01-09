import { ActionStep, IActionInputs, IBuildInput, IDeployInput, IPushInput } from './types'
import * as core from '@actions/core'
import { getBuilderDefinitions } from './utils'

const getBuildInputs = (): IBuildInput => {
  const tag = core.getInput('tag')

  return {
    tag,
    images: [],
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

let inputs: IActionInputs | undefined
export const getInputs = async (): Promise<IActionInputs> => {
  if (inputs !== undefined) {
    return inputs
  }

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

  core.info(`Detected action steps: ${actionSteps.join(', ')}`)
  core.info(`Action inputs: ${JSON.stringify(results)}`)
  core.info(`Builder definitions: ${JSON.stringify(await getBuilderDefinitions())}`)

  if (results[ActionStep.BUILD] !== undefined) {
    if (results[ActionStep.BUILD].images.length === 0 && results[ActionStep.DEPLOY] !== undefined) {
      // calculate images from services
      const buildDefinitions = await getBuilderDefinitions()

      const images: string[] = []
      for (const service of results[ActionStep.DEPLOY].services) {
        const definition = buildDefinitions.find((d) => d.services.includes(service))
        if (definition === undefined) {
          core.error(`No builder definition found for service: ${service}!`)
          throw new Error(`No builder definition found for service: ${service}!`)
        }

        if (!images.includes(definition.imageName)) {
          images.push(definition.imageName)
        }
      }
    }
  }

  inputs = results
  return results
}

const getInputList = (name: string): string[] => {
  const items = core.getInput(name)
  return items
    .split(' ')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}
