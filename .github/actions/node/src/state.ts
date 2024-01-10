import * as core from '@actions/core'

export const IS_POST = !!process.env['STATE_isPost']

if (!IS_POST) {
  core.saveState('isPost', 'true')
}
