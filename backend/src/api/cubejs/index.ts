export default (app) => {
  app.get(`/tenant/:tenantId/cubejs/auth`, require('./cubeJsAuth').default)
  app.post(`/tenant/:tenantId/cubejs/verify`, require('./cubeJsVerifyToken').default)
}
