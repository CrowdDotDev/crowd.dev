import { safeWrap } from '@/middlewares/errorMiddleware'

export default (app) => {
  // Category groups routes
  app.post('/category-group', safeWrap(require('./categoryGroupCreate').default))
  app.get('/category-group', safeWrap(require('./categoryGroupList').default))
  app.patch('/category-group/:id', safeWrap(require('./categoryGroupUpdate').default))
  app.delete('/category-group/:id', safeWrap(require('./categoryGroupDelete').default))

  // Categories routes
  app.post('/category', safeWrap(require('./categoryCreate').default))
  app.get('/category', safeWrap(require('./categoryList').default))
  app.patch('/category/:id', safeWrap(require('./categoryUpdate').default))
  app.delete('/category/:id', safeWrap(require('./categoryDelete').default))
  app.delete('/category', safeWrap(require('./categoryBulkDelete').default))
}
