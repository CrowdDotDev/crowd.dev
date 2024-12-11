import { Context } from '@temporalio/activity'
import { ActivityExecuteInput, ActivityInboundCallsInterceptor, Next } from '@temporalio/worker'

import { getServiceChildLogger } from '@crowd/logging'
import telemetry from '@crowd/telemetry'

export class ActivityMonitoringInterceptor implements ActivityInboundCallsInterceptor {
  public constructor(private readonly ctx: Context) {}
  async execute(
    input: ActivityExecuteInput,
    next: Next<ActivityInboundCallsInterceptor, 'execute'>,
  ): Promise<unknown> {
    const tags = {
      workflow_type: this.ctx.info.workflowType,
      task_queue: this.ctx.info.taskQueue,
      activity_type: this.ctx.info.activityType,
    }

    const timer = telemetry.timer('temporal.activity_execution_duration', tags)

    try {
      const res = await next(input)
      return res
    } catch (err) {
      const log = getServiceChildLogger('activity-interceptor', {
        activityType: this.ctx.info.activityType,
        activityId: this.ctx.info.activityId,
        workflowType: this.ctx.info.workflowType,
        taskQueue: this.ctx.info.taskQueue,
        workflowId: this.ctx.info.workflowExecution.workflowId,
        runId: this.ctx.info.workflowExecution.runId,
      })

      log.error(err, 'Error while processing an activity!')
      throw err
    } finally {
      timer.stop()
    }
  }
}
