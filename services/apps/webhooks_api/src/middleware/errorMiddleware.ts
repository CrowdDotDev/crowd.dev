import express from 'express'

/* eslint-disable @typescript-eslint/no-unused-vars */

export async function errorMiddleware(error, req, res, next) {
  await req?.responseHandler?.error(req, res, error)
}

export const safeWrap =
  (handler: express.RequestHandler): express.RequestHandler =>
  async (req, res, next) => {
    try {
      await handler(req, res, next)
    } catch (err) {
      next(err)
    }
  }
