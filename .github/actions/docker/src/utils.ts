import { ActionSteps, IBuildInput, IDeployInput, IPushInput } from './types'
import * as core from '@actions/core'

export const loadInputs = async (steps: ActionSteps[]) => {
  const inputs: any = {}

  for (const step of steps) {
    switch (step) {
      case ActionSteps.BUILD:
        inputs[step] = {
          images: core.getInput('images').split(' '),
        } as IBuildInput
        break
      case ActionSteps.PUSH:
        inputs[step] = {
          username: process.env['DOCKERHUB_USERNAME'],
          password: process.env['DOCKERHUB_PASSWORD'],
        } as IPushInput
        break
      case ActionSteps.DEPLOY:
        inputs[step] = {
          services: core.getInput('services').split(' '),
        } as IDeployInput
        break
    }
  }

  return inputs
}
