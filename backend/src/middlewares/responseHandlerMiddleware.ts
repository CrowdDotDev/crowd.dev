import ApiResponseHandler from '../api/apiResponseHandler'

export async function responseHandlerMiddleware(req, res, next) {
  req.responseHandler = new ApiResponseHandler(req)
  next()
}
