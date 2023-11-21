import {
  proxyActivities,
  startChild,
  ParentClosePolicy,
  ChildWorkflowCancellationType,
} from '@temporalio/workflow'

import * as activities from '../../activities/eagleeye-digest/getNextEmails'
import { eagleeyeSendEmailAndUpdateHistory } from './sendEmailAndUpdateHistory'

// Configure timeouts and retry policies to fetch emails to send.
const { eagleeyeGetNextEmails } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 seconds',
})

/*
eagleeyeGetAndSendNextEmails is a Temporal workflow that:
  - [Activity]: Get address emails to send a new email digest to.
  - [Child Workflow]: Build and send the email for each user found in the
    previous activity. Child workflows are completely "detached" from the parent
    workflow, meaning they will continue to run and not be cancelled even if this
    one is.
*/
export async function eagleeyeGetAndSendNextEmails(): Promise<void> {
  const users = await eagleeyeGetNextEmails()

  await Promise.all(
    users.map((user) => {
      return startChild(eagleeyeSendEmailAndUpdateHistory, {
        workflowId: 'email-eagleeye-digest/' + user.tenantId + '/' + user.userId,
        cancellationType: ChildWorkflowCancellationType.ABANDON,
        parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
        workflowExecutionTimeout: '15 minutes',
        retry: {
          backoffCoefficient: 2,
          maximumAttempts: 10,
          initialInterval: 2 * 1000,
          maximumInterval: 30 * 1000,
        },
        args: [user],
      })
    }),
  )
}
