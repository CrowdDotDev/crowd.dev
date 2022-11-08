// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function errorMiddleware(error, req, res, next) {
  await req.responseHandler.error(req, res, error)
}
