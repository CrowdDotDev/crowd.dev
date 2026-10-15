import { z } from 'zod'

import { requeueProjectCatalogEvaluation } from '@crowd/data-access-layer'
import type { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'
import { applyRequestStatus, repoLabel } from '@crowd/project-onboarding'
import { WorkflowIdReusePolicy } from '@crowd/temporal'

import { IServiceOptions } from '../IServiceOptions'
import type { OnboardingRequestTemporal } from './onboardingRequestBot'
import { postToResponseUrl, textMessage } from './onboardProjectCommand'
import { getBgQx } from './slackBackground'

const catalogIdSchema = z.string().uuid()

export interface IRetryEvaluationCommand {
  catalogId: string
  responseUrl: string
  actorId: string
  temporal: OnboardingRequestTemporal | null
  log: IServiceOptions['log']
}

function replaceOriginal(responseUrl: string, text: string, log: IServiceOptions['log']) {
  const replaced = { ...textMessage(text), replace_original: true }
  return postToResponseUrl(responseUrl, replaced, log)
}

function postEphemeral(responseUrl: string, text: string, log: IServiceOptions['log']) {
  const ephemeral = { ...textMessage(text), response_type: 'ephemeral', replace_original: false }
  return postToResponseUrl(responseUrl, ephemeral, log)
}

export function postRetryEvaluationFailure(responseUrl: string, log: IServiceOptions['log']) {
  return postEphemeral(
    responseUrl,
    ':warning: The check could not be started again. Please try once more in a minute.',
    log,
  )
}

async function startRetryEvaluation(
  temporal: OnboardingRequestTemporal | null,
  catalogId: string,
  log: IServiceOptions['log'],
): Promise<boolean> {
  if (!temporal) {
    log.warn({ catalogId }, 'Temporal not configured, the retried row waits for the schedule.')
    return false
  }
  try {
    await temporal.workflow.start('evaluateProjects', {
      taskQueue: 'projects-evaluation',
      workflowId: `evaluate-retry-${catalogId}-${Date.now()}`,
      workflowIdReusePolicy: WorkflowIdReusePolicy.REJECT_DUPLICATE,
      args: [{ catalogIds: [catalogId] }],
    })
    return true
  } catch (err) {
    log.error(
      { catalogId, err },
      'Starting the retried evaluation failed, the row waits for the schedule.',
    )
    return false
  }
}

export async function runRetryEvaluationCommand({
  catalogId: rawCatalogId,
  responseUrl,
  actorId,
  temporal,
  log,
}: IRetryEvaluationCommand): Promise<void> {
  const parsedId = catalogIdSchema.safeParse(rawCatalogId)
  if (!parsedId.success) {
    log.warn({ rawCatalogId }, 'Retry click carried an invalid catalog id.')
    await replaceOriginal(responseUrl, ':no_entry: This request is no longer valid.', log)
    return
  }
  const catalogId = parsedId.data

  const qx: QueryExecutor = await getBgQx()
  const row = await requeueProjectCatalogEvaluation(qx, catalogId)
  if (!row) {
    log.info({ catalogId, actorId }, 'Retry click for a row that is no longer in error.')
    await postEphemeral(responseUrl, 'This request is no longer waiting for a retry.', log)
    return
  }

  log.info({ catalogId, repoUrl: row.repoUrl, actorId }, 'Evaluation requeued from Slack.')
  // The reaction goes first: a fast retry could finish and clear it before a late add.
  await applyRequestStatus(qx, row, 'checking')
  const started = await startRetryEvaluation(temporal, catalogId, log)
  await replaceOriginal(
    responseUrl,
    started
      ? `:hourglass_flowing_sand: Checking ${repoLabel(row.repoUrl)} again… I'll post the result in this thread.`
      : `:hourglass_flowing_sand: ${repoLabel(row.repoUrl)} is queued for the next scheduled check. I'll post the result in this thread.`,
    log,
  )
}
