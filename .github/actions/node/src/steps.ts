import { getInputs } from './inputs'
import { ActionStep, CloudEnvironment } from './types'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { getBuilderDefinitions } from './utils'

const imageTagMap = new Map<string, string>()

export const buildStep = async (): Promise<void> => {
  const inputs = await getInputs()

  if (inputs[ActionStep.BUILD] === undefined) {
    core.error('No build inputs provided!')
    throw new Error('No build inputs provided!')
  }

  const { images, tag } = inputs[ActionStep.BUILD]
  if (images.length === 0) {
    core.error('No images provided!')
    throw new Error('No images provided!')
  }

  if (!tag) {
    core.error('No tag provided!')
    throw new Error('No tag provided!')
  }

  const timestamp = Math.floor(Date.now() / 1000)

  const actualTag = `${tag}.${timestamp}`

  const alreadyBuilt: string[] = []

  for (const image of images) {
    if (alreadyBuilt.includes(image)) {
      core.info(`Skipping already built image: ${image}:${actualTag}`)
      continue
    }

    core.info(`Building image: ${image}:${actualTag}`)
    const exitCode = await exec.exec('bash', ['cli', 'build', image, actualTag], {
      cwd: './scripts',
    })

    if (exitCode !== 0) {
      core.error(`Failed to build image: ${image}:${actualTag}`)
    } else {
      alreadyBuilt.push(image)
      imageTagMap.set(image, actualTag)
    }
  }
}

export const pushStep = async (): Promise<void> => {
  const inputs = await getInputs()
  const images = inputs[ActionStep.BUILD]?.images ?? []
  const pushInput = inputs[ActionStep.PUSH]
  if (!pushInput) {
    core.error('No push inputs provided!')
    throw new Error('No push inputs provided!')
  }

  if (images.length === 0) {
    core.error('No images provided!')
    throw new Error('No images provided!')
  }

  // do a docker login
  const exitCode = await exec.exec('docker', [
    'login',
    '--username',
    pushInput.dockerUsername,
    '--password',
    pushInput.dockerPassword,
  ])

  if (exitCode !== 0) {
    core.error('Failed to login to docker!')
    throw new Error('Failed to login to docker!')
  }

  // now push the images
  const alreadyPushed: string[] = []
  for (const image of images) {
    if (alreadyPushed.includes(image)) {
      core.info(`Skipping already pushed image: ${image}`)
      continue
    }

    if (!imageTagMap.has(image)) {
      core.warning(`No tag found for image: ${image} - image wasn't built successfully!`)
      continue
    }

    const tag = imageTagMap.get(image)

    core.info(`Pushing image: ${image}:${tag}!`)

    const exitCode = await exec.exec('bash', ['cli', 'push', image, tag], {
      cwd: './scripts',
    })

    if (exitCode !== 0) {
      core.error(`Failed to push image: ${image}:${tag}`)
      imageTagMap.delete(image)
    } else {
      alreadyPushed.push(image)
    }
  }
}

export const deployStep = async (): Promise<void> => {
  const inputs = await getInputs()

  const deployInput = inputs[ActionStep.DEPLOY]
  if (!deployInput) {
    core.error('No deploy inputs provided!')
    throw new Error('No deploy inputs provided!')
  }

  if (deployInput.services.length === 0) {
    core.warning('No services specified for deploy!')
    return
  }

  const env = {
    AWS_ACCESS_KEY_ID: deployInput.awsAccessKeyId,
    AWS_SECRET_ACCESS_KEY: deployInput.awsSecretAccessKey,
    AWS_REGION: deployInput.awsRegion,
  }

  let exitCode = await exec.exec(
    'aws',
    [
      'eks',
      'update-kubeconfig',
      '--name',
      deployInput.eksClusterName,
      '--role-arn',
      deployInput.awsRoleArn,
    ],
    {
      env,
    },
  )

  if (exitCode !== 0) {
    core.error('Failed to update kubeconfig!')
    throw new Error('Failed to update kubeconfig!')
  }

  const builderDefinitions = await getBuilderDefinitions()
  for (const service of deployInput.services) {
    const builderDefinition = builderDefinitions.find((b) => b.services.includes(service))

    if (!builderDefinition) {
      core.warning(`No builder definition found for service: ${service}`)
      continue
    }

    const image = builderDefinition.imageName
    if (!imageTagMap.has(image)) {
      core.warning(`No tag found for image: ${image} - image wasn't built successfully!`)
      continue
    }

    const tag = imageTagMap.get(image)

    const prioritized = builderDefinition.prioritizedServices.includes(service)
    const servicesToUpdate: string[] = []

    if (prioritized) {
      switch (deployInput.cloudEnvironment) {
        case CloudEnvironment.PRODUCTION: {
          servicesToUpdate.push(
            ...[`${service}-system`, `${service}-normal`, `${service}-high`, `${service}-urgent`],
          )
          break
        }
        case CloudEnvironment.LF_PRODUCTION: {
          servicesToUpdate.push(...[`${service}-system`, `${service}-normal`, `${service}-high`])
          break
        }

        case CloudEnvironment.LF_STAGING:
        case CloudEnvironment.STAGING: {
          servicesToUpdate.push(`${service}-normal`)
          break
        }

        default:
          core.error(`Unknown cloud environment: ${deployInput.cloudEnvironment}`)
          throw new Error(`Unknown cloud environment: ${deployInput.cloudEnvironment}`)
      }
    } else {
      servicesToUpdate.push(service)
    }

    core.info(
      `Deploying service: ${service} with image: ${image}:${tag} to deployments: ${servicesToUpdate.join(
        ', ',
      )}`,
    )

    for (const toDeploy of servicesToUpdate) {
      exitCode = await exec.exec('kubectl', [
        'set',
        'image',
        `deployments/${toDeploy}-dpl`,
        `${toDeploy}=${image}:${tag}`,
      ])
    }
  }
}
