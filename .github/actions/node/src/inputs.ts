import {
  ActionStep,
  CloudEnvironment,
  IActionInputs,
  IBuildInput,
  IDeployInput,
  IPushInput,
} from './types'
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
    core.error('No DockerHub username found in DOCKERHUB_USERNAME environment variable!')
    throw new Error('No DockerHub username found in DOCKERHUB_USERNAME environment variable!')
  }

  const password = process.env.DOCKERHUB_PASSWORD
  if (!password) {
    core.error('No DockerHub password found in DOCKERHUB_PASSWORD environment variable!')
    throw new Error('No DockerHub password found in DOCKERHUB_PASSWORD environment variable!')
  }

  return {
    dockerUsername: username,
    dockerPassword: password,
  }
}

const getDeployIUputs = (): IDeployInput => {
  const services = getInputList('services')

  const cloudEnvironment = process.env['CLOUD_ENV'] as CloudEnvironment
  if (!cloudEnvironment) {
    core.error('No CLOUD_ENV environment variable found!')
    throw new Error('No CLOUD_ENV environment variable found!')
  }

  const eksClusterName = process.env.CROWD_CLUSTER
  if (!eksClusterName) {
    core.error('No CROWD_CLUSTER environment variable found!')
    throw new Error('No CROWD_CLUSTER environment variable found!')
  }

  const awsRoleArn = process.env.CROWD_ROLE_ARN
  if (!awsRoleArn) {
    core.error('No CROWD_ROLE_ARN environment variable found!')
    throw new Error('No CROWD_ROLE_ARN environment variable found!')
  }

  const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID
  if (!awsAccessKeyId) {
    core.error('No AWS_ACCESS_KEY_ID environment variable found!')
    throw new Error('No AWS_ACCESS_KEY_ID environment variable found!')
  }

  const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  if (!awsSecretAccessKey) {
    core.error('No AWS_SECRET_ACCESS_KEY environment variable found!')
    throw new Error('No AWS_SECRET_ACCESS_KEY environment variable found!')
  }

  const awsRegion = process.env.AWS_REGION
  if (!awsRegion) {
    core.error('No AWS_REGION environment variable found!')
    throw new Error('No AWS_REGION environment variable found!')
  }

  return {
    services,
    cloudEnvironment,
    eksClusterName,
    awsRoleArn,
    awsAccessKeyId,
    awsSecretAccessKey,
    awsRegion,
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

      results[ActionStep.BUILD].images = images
    }
  }

  if (results[ActionStep.PUSH] !== undefined && results[ActionStep.BUILD] === undefined) {
    core.error('Push step provided without build step!')
    throw new Error('Push step provided without build step!')
  }

  if (results[ActionStep.DEPLOY] !== undefined && results[ActionStep.PUSH] === undefined) {
    core.error('Deploy step provided without push step!')
    throw new Error('Deploy step provided without push step!')
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
