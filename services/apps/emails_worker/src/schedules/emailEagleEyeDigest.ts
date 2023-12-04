import { ScheduleAlreadyRunning, ScheduleOverlapPolicy } from '@temporalio/client'

import { svc } from '../main'
import { eagleeyeGetAndSendNextEmails } from '../workflows'
import { TemporalWorkflowId } from '@crowd/types'

export const scheduleEmailEagleEyeDigest = async () => {
  try {
    await svc.temporal.schedule.create({
      scheduleId: 'email-eagleeye-digest',
      spec: {
        intervals: [
          {
            every: '30 minutes',
          },
        ],
      },
      policies: {
        overlap: ScheduleOverlapPolicy.BUFFER_ONE,
        catchupWindow: '1 minute',
      },
      action: {
        workflowId: TemporalWorkflowId.EMAIL_EAGLEEYE_DIGEST,
        type: 'startWorkflow',
        workflowType: eagleeyeGetAndSendNextEmails,
        taskQueue: 'emails',
        workflowExecutionTimeout: '5 minutes',
      },
    })
  } catch (err) {
    if (err instanceof ScheduleAlreadyRunning) {
      svc.log.info('Schedule already registered in Temporal.')
      svc.log.info('Configuration may have changed since. Please make sure they are in sync.')
    } else {
      throw new Error(err)
    }
  }
}
