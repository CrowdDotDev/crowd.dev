import { LoggerBase } from '@crowd/logging'

import { IServiceOptions } from '../services/IServiceOptions'

/* eslint-disable class-methods-use-this */
export default class ApiResponseHandler extends LoggerBase {
  public constructor(options: IServiceOptions) {
    super(options.log)
  }

  async download(req, res, path) {
    res.download(path)
  }

  async success(_req, res, payload, status = 200) {
    if (payload !== undefined) {
      // We might want to send a custom status, even the operation succeeded
      res.status(status).send(payload)
    } else {
      res.sendStatus(200)
    }
  }

  async error(req, res, error) {
    if (error && error.name && error.name.includes('Sequelize')) {
      req.log.error(
        error,
        {
          code: 500,
          url: req.url,
          method: req.method,
          query: error.sql,
          body: req.body,
          errorMessage: error.original?.message,
        },
        'Database error while processing REST API request!',
      )
      res.status(500).send('Internal Server Error')
    } else if (error && [400, 401, 403, 404].includes(error.code)) {
      req.log.error(
        error,
        { code: error.code, url: req.url, method: req.method, query: req.query, body: req.body },
        'Client error while processing REST API request!',
      )
      res.status(error.code).send(error.message)
    } else if (error && error.message === 'stream is not readable') {
      res.status(400).send('Request interrupted')
    } else {
      if (error.code && (!Number.isInteger(error.code) || error.code < 100 || error.code > 599)) {
        error.code = 500
      } else if (!error.code) {
        error.code = 500
      }

      req.log.error(
        error,
        { code: error.code, url: req.url, method: req.method, query: req.query, body: req.body },
        'Error while processing REST API request!',
      )
      res.status(error.code).send(error.message)
    }
  }
}
