import * as core from '@actions/core'

export const IS_POST = !!process.env['STATE_isPost']

if (!IS_POST) {
  core.saveState('isPost', 'true')
}

export const IMAGE_SERVICE_MAP = new Map<string, string[]>([
  ['backend', ['api', 'job-generator', 'nodejs-worker', 'discord-ws']],
  ['python-worker', ['python-worker']],
  ['data-sink-worker', ['data-sink-worker']],
  ['integration-run-worker', ['integration-run-worker']],
  ['integration-stream-worker', ['integration-stream-worker']],
  ['integration-data-worker', ['integration-data-worker']],
  ['search-sync-worker', ['search-sync-worker']],
  ['webhook-api', ['webhook-api']],
  ['automations-worker', ['automations-worker']],
  ['emails-worker', ['emails-worker']],
  ['members-enrichment-worker', ['members-enrichment-worker']],
  ['organizations-enrichment-worker', ['organizations-enrichment-worker']],
  ['entity-merging-worker', ['entity-merging-worker']],
  ['frontend', ['frontend']],
  ['frontend-dev', ['frontend-dev']],
])
