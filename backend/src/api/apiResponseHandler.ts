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

  async error(_req, res, error) {
    if (error && [400, 401, 403, 404].includes(error.code)) {
      res.status(error.code).send(error.message)
    } else {
      if (!error.code) {
        error.code = 500
        this.log.error(
          error,
          { url: _req.url, method: _req.method, query: _req.query, body: _req.body },
          'Unknown error while processing REST API request!',
        )
      }
      io.notifyError(error)
      res.status(error.code).send(error.message)
    }
  }
}
