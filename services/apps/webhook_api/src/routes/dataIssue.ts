import { asyncWrap } from '../middleware/error'
import { Error400BadRequest } from '@crowd/common'
import express from 'express'

const SIGNATURE_HEADER = 'x-hub-signature'
const EVENT_HEADER = 'x-github-event'

export const installGithubRoutes = async (app: express.Express) => {
  app.post(
    '/github',
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
      const identifier = data.installation.id.toString()

      // check event - is it issue close?
      // if issue close, find data issue by issue url in (dataIssues)
      // if found send resolution email to dataIssue.createdById.email
      // afterwards set dataIssue.resolutionEmailSentAt dataIssuel.resolutionEmailSentTo
    }),
  )
}
