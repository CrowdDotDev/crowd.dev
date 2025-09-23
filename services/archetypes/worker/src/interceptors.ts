import {
  Next,
  WorkflowExecuteInput,
  WorkflowInboundCallsInterceptor,
  proxyActivities,
  workflowInfo,
} from '@temporalio/workflow'

import * as activities from './activities'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 seconds',
})

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
      await activity.telemetryIncrement('temporal.workflow_execution_error', 1, tags)
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
