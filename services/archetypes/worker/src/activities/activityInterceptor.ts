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
      workflow_id: this.ctx.info.workflowExecution.workflowId,
      workflow_run_id: this.ctx.info.workflowExecution.runId,
      workflow_type: this.ctx.info.workflowType,
      task_queue: this.ctx.info.taskQueue,
      activity_type: this.ctx.info.activityType,
      attempts: this.ctx.info.attempt,
    }

    const log = getServiceChildLogger('activity-interceptor', {
      activityType: this.ctx.info.activityType,
      activityId: this.ctx.info.activityId,
      workflowType: this.ctx.info.workflowType,
      taskQueue: this.ctx.info.taskQueue,
      workflowId: this.ctx.info.workflowExecution.workflowId,
      runId: this.ctx.info.workflowExecution.runId,
    })

    if (this.ctx.info.attempt > 10) {
      log.warn(
        { slackNotify: true },
        `Activity ${this.ctx.info.activityType} with id ${this.ctx.info.activityId} was retried ${this.ctx.info.attempt} times!`,
      )
    }

    telemetry.increment('temporal.activity_execution', 1, tags)

    const start = new Date()

    try {
      const res = await next(input)
      return res
    } catch (err) {
      log.error(err, 'Error while processing an activity!')
      throw err
    } finally {
      const end = new Date()
      const duration = end.getTime() - start.getTime()

      // Only send telemetry if duration is more than 2 hours
      if (duration > 2 * 60 * 60 * 1000) {
        telemetry.distribution('temporal.activity_execution_duration', duration, tags)
      }
    }
  }
}
