import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  // Collections routes
  app.post('/collections/query', safeWrap(require('./collectionsQuery').default))
  app.post('/collections', safeWrap(require('./collectionsCreate').default))
  app.get('/collections/:id', safeWrap(require('./collectionsGet').default))
  app.post('/collections/:id', safeWrap(require('./collectionsUpdate').default))
  app.delete('/collections/:id', safeWrap(require('./collectionsDestroy').default))

  // Insights projects routes
  app.post(
    '/collections/insights-projects/query',
    safeWrap(require('./insightsProjects/insightsProjectsQuery').default),
  )
  app.post(
    '/collections/insights-projects',
    safeWrap(require('./insightsProjects/insightsProjectsCreate').default),
  )
  app.delete(
    '/collections/insights-projects/:id',
    safeWrap(require('./insightsProjects/insightsProjectsDestroy').default),
  )
}
