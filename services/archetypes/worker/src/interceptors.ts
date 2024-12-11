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
      workflow_type: info.workflowType,
      task_queue: info.taskQueue,
    }

    activity.telemetryIncrement('temporal.workflow_processing', 1, tags)
    const start = new Date()

    try {
      const result = await next(input)
      return result
    } finally {
      const end = new Date()
      const duration = end.getTime() - start.getTime()
      activity.telemetryDistribution('temporal.workflow_execution_duration', duration, tags)
      activity.telemetryDecrement('temporal.workflow_processing', 1, tags)
    }
  }
}
