import { loadInputs } from './inputs'
import { IS_POST } from './state'
import * as core from '@actions/core'
import { loadBuilderDefinitions } from './utils'
/**
 * Runs the action
 */
async function run() {
  const inputs = await loadInputs()

  const builderDefinitions = await loadBuilderDefinitions()
  for (const def of builderDefinitions) {
    core.info(`Loaded builder definition: ${JSON.stringify(def)}`)
  }

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
