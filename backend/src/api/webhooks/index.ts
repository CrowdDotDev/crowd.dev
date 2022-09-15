export default (app) => {
  app.post(`/github`, require('./github').default)
}
