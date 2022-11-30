import { IServiceOptions } from '../services/IServiceOptions'
import { LoggingBase } from '../services/loggingBase'

const io = require('@pm2/io')

/* eslint-disable class-methods-use-this */
export default class ApiResponseHandler extends LoggingBase {
  public constructor(options: IServiceOptions) {
    super(options)
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
    if (error && [400, 401, 403, 404].includes(error.code)) {
      req.log.error(
        error,
        { code: error.code, url: req.url, method: req.method, query: req.query, body: req.body },
        'Client error while processing REST API request!',
      )
      res.status(error.code).send(error.message)
    } else {
      if (!error.code) {
        error.code = 500
      }
      req.log.error(
        error,
        { code: error.code, url: req.url, method: req.method, query: req.query, body: req.body },
        'Error while processing REST API request!',
      )
      io.notifyError(error)
      res.status(error.code).send(error.message)
    }
  }
}
