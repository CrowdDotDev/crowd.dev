export function languageMiddleware(req, res, next) {
  req.language = req.headers['accept-language'] || 'en'
  return next()
}
