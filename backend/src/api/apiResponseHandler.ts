const io = require('@pm2/io')

export default class ApiResponseHandler {
  static async download(req, res, path) {
    res.download(path)
  }

  static async success(_req, res, payload, status = 200) {
    if (payload !== undefined) {
      // We might want to send a custom status, even the operation succeeded
      res.status(status).send(payload)
    } else {
      res.sendStatus(200)
    }
  }

  static async error(_req, res, error) {
    if (error && [400, 401, 403, 404].includes(error.code)) {
      res.status(error.code).send(error.message)
    } else {
      if (!error.code) {
        error.code = 500
      }
      io.notifyError(error)
      res.status(error.code).send(error.message)
    }
  }
}
