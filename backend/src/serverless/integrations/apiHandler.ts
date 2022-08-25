// index.js
import cors from 'cors'
import ApiResponseHandler from '../../api/apiResponseHandler'
import githubWebhookWorker from './workers/githubWebhookWorker'

const serverless = require('serverless-http')
const express = require('express')

// Making a handler with express for the API.
// This is so that we can have proper responses to requests.

const app = express()
app.use(cors({ origin: true }))

app.post('/webhooks/github', async (req, res) => {
  try {
    const out = await githubWebhookWorker(req)
    let status = 200
    if (out.status === 204) {
      status = 204
    }
    await ApiResponseHandler.success(req, res, out, status)
  } catch (err) {
    await ApiResponseHandler.error(req, res, err)
  }
})

export const handler = serverless(app)
