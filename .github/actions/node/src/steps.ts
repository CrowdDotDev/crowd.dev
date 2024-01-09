import { getInputs } from './inputs'
import { setImageTag } from './state'
import { ActionStep } from './types'
import * as core from '@actions/core'
import * as exec from '@actions/exec'

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

  for (const image of images) {
    core.info(`Building image: ${image}:${actualTag}`)
    const exitCode = await exec.exec('bash', ['cli', 'build', image, tag], {
      listeners: {
        stdout: (data) => {
          core.info(data.toString())
        },
        stderr: (data) => {
          core.info(data.toString())
        },
      },
      cwd: './scripts',
    })

    if (exitCode !== 0) {
      core.error(`Failed to build image: ${image}:${actualTag}`)
      throw new Error(`Failed to build image: ${image}:${actualTag}`)
    }

    setImageTag(image, actualTag)
  }
}
