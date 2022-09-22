export default (app) => {
  app.post(`/tenant/:tenantId/eagleEyeContent`, require('./eagleEyeContentSearch').default)
  app.post(`/tenant/:tenantId/eagleEyeContent/query`, require('./eagleEyeContentQuery').default)
  app.put(`/tenant/:tenantId/eagleEyeContent/:id`, require('./eagleEyeContentUpdate').default)
  app.get(`/tenant/:tenantId/eagleEyeContent`, require('./eagleEyeContentList').default)
  app.get(`/tenant/:tenantId/eagleEyeContent/:id`, require('./eagleEyeContentFind').default)
}
