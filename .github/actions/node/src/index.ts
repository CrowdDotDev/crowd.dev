import { loadInputs } from './inputs'
import { IS_POST } from './state'
import * as core from '@actions/core'
/**
 * Runs the action
 */
async function run() {
  const inputs = await loadInputs()

  for (const step of inputs.steps) {
    core.info(`Running step: ${step}`)
  }
}

/**
 * Runs the post action cleanup step
 */
async function post() {}

setImmediate(async () => {
  if (!IS_POST) {
    await run()
  } else {
    await post()
  }
})
