import { safeWrap } from '@/middlewares/errorMiddleware'

export default (app) => {

  // Category groups routes
  // app.post('/collections/query', safeWrap(require('./collectionsQuery').default))
  app.post('/category-group', safeWrap(require('./categoryGroupCreate').default))
  app.get('/category-group', safeWrap(require('./categoryGroupList').default))
  app.patch('/category-group/:id', safeWrap(require('./categoryGroupUpdate').default))
  app.delete('/category-group/:id', safeWrap(require('./categoryGroupDelete').default))
  //
  // app.get('/segments/:id/repositories', safeWrap(require('./segmentsRepositoriesGet').default))
}
