import * as core from '@actions/core'

export const IS_POST = !!process.env['STATE_isPost']

if (!IS_POST) {
  core.saveState('isPost', 'true')
}

export const setImageTag = (image: string, tag: string): void => {
  core.saveState(`imageTag.${image}`, tag)
}

export const getImageTag = (image: string): string | undefined => {
  return core.getState(`imageTag.${image}`)
}
