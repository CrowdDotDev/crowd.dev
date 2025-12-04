import {
  ActivityFailure,
  ApplicationFailure,
  Next,
  WorkflowExecuteInput,
  WorkflowInboundCallsInterceptor,
  proxyActivities,
  workflowInfo,
} from '@temporalio/workflow'

import { SlackPersona } from '@crowd/slack'

import * as activities from './activities'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 seconds',
})

/**
 * Extract detailed error information when an activity reaches retry limit
 */
function getActivityRetryLimitDetails(err: ActivityFailure): string {
  let details = `*Activity:* \`${err.activityType}\`\n`
  details += `*Activity ID:* \`${err.activityId || 'N/A'}\`\n`
  details += `*Retry State:* ${err.retryState}\n\n`

  // Get the root cause error message and type
  if (err.cause) {
    details += `*Error:* ${err.cause.message}\n`

    // If it's an ApplicationFailure, get the type (e.g., AxiosError)
    if (err.cause instanceof ApplicationFailure && err.cause.type) {
      details += `*Error Type:* ${err.cause.type}\n`
    }

    // Add stack trace (first 10 lines for context)
    if (err.cause.stack) {
      const stackLines = err.cause.stack.split('\n').slice(0, 10)
      details += `\n*Stack Trace (first 10 lines):*\n\`\`\`\n${stackLines.join('\n')}\n\`\`\``
    }
  }

  return details
}

export class WorkflowMonitoringInterceptor implements WorkflowInboundCallsInterceptor {
  async execute(
    input: WorkflowExecuteInput,
    next: Next<WorkflowInboundCallsInterceptor, 'execute'>,
  ): Promise<unknown> {
    const info = workflowInfo()

    const tags = {
      workflow_run_id: info.runId,
      workflow_id: info.workflowId,
      workflow_type: info.workflowType,
      task_queue: info.taskQueue,
      attempts: info.attempt,
    }

    const start = new Date()

    try {
      const result = await next(input)
      return result
    } catch (err) {
      if (err.message !== 'Workflow continued as new') {
        await activity.telemetryIncrement('temporal.workflow_execution_error', 1, tags)

        // Only send detailed notification if it's an activity that reached retry limit
        if (err instanceof ActivityFailure && err.retryState === 'MAXIMUM_ATTEMPTS_REACHED') {
          const errorDetails = getActivityRetryLimitDetails(err)
          const message = `*Workflow Failed: Activity Retry Limit Reached*\n\n*Workflow:* \`${info.workflowType}\`\n*Workflow ID:* \`${info.workflowId}\`\n*Run ID:* \`${info.runId}\`\n\n${errorDetails}`

          await activity.slackNotify(message, SlackPersona.ERROR_REPORTER)
        } else {
          // For other errors, send a simpler notification
          const message = `*Workflow Failed*\n\n*Workflow:* \`${info.workflowType}\`\n*Workflow ID:* \`${info.workflowId}\`\n*Run ID:* \`${info.runId}\`\n*Error:* ${err.message}`

          await activity.slackNotify(message, SlackPersona.ERROR_REPORTER)
        }
      }

      throw err
    } finally {
      const end = new Date()
      const duration = end.getTime() - start.getTime()

      // Only send telemetry if duration is more than 2 hours
      if (duration > 3 * 60 * 60 * 1000) {
        await activity.telemetryDistribution('temporal.workflow_execution_duration', duration, tags)
      }
    }
  }
}
