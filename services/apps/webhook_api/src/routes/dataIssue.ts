import express from 'express'
import verifyGithubWebhook from 'verify-github-webhook'

import { Error400BadRequest } from '@crowd/common'
import {
  findDataIssueByUrl,
  markDataIssueAsResolved,
} from '@crowd/data-access-layer/src/data_issues'
import { dbStoreQx } from '@crowd/data-access-layer/src/queryExecutor'
import { UserField, findUserById } from '@crowd/data-access-layer/src/users'

import { GITHUB_ISSUE_REPORTER_CONFIG } from '../conf'
import { asyncWrap } from '../middleware/error'

const SIGNATURE_HEADER = 'x-hub-signature'
const EVENT_HEADER = 'x-github-event'

export const installDataIssueRoutes = async (app: express.Express) => {
  app.post(
    '/data-issue',
    asyncWrap(async (req, res) => {
      if (!req.headers[SIGNATURE_HEADER]) {
        throw new Error400BadRequest('Missing signature header!')
      }
      const signature = req.headers['x-hub-signature']

      if (!req.headers[EVENT_HEADER]) {
        throw new Error400BadRequest('Missing event header!')
      }
      const event = req.headers['x-github-event']

      const data = req.body
      if (!data.installation?.id) {
        throw new Error400BadRequest('Missing installation id!')
      }

      if (
        !verifyGithubWebhook(
          signature,
          JSON.stringify(data),
          GITHUB_ISSUE_REPORTER_CONFIG().webhookSecret,
        )
      ) {
        req.log.warn({ signature }, 'Github Issue Reporter Webhook signature verification failed!')
        res.sendStatus(200)
        return
      }

      if (event === 'issues' && data.action === 'closed') {
        // find data issue by issue url in (dataIssues)
        const qx = dbStoreQx(req.dbStore)
        const dataIssue = await findDataIssueByUrl(qx, data.issue.html_url)

        if (!dataIssue || !dataIssue.createdById) {
          res.sendStatus(200)
          return
        }

        const user = await findUserById(qx, dataIssue.createdById, [UserField.ID, UserField.EMAIL])

        if (!user) {
          res.sendStatus(200)
          return
        }

        // send resolution email to dataIssue.createdById.email
        req.log.info({ email: user.email }, 'Resolution mail sent!')

        await markDataIssueAsResolved(qx, dataIssue.id, { resolutionEmailSentTo: user.email })
      }
    }),
  )
}
