import ApiResponseHandler from '../api/apiResponseHandler'

export async function responseHandlerMiddleware(req, res, next) {
  const responseHandler = new ApiResponseHandler(req)
  req.responseHandler = responseHandler
  next()
}
