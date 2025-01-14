import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(`/conversation`, safeWrap(require('./conversationCreate').default))
  app.put(`/conversation/:id`, safeWrap(require('./conversationUpdate').default))
  app.delete(`/conversation`, safeWrap(require('./conversationDestroy').default))
  app.post(`/conversation/query`, safeWrap(require('./conversationQuery').default))
  app.get(`/conversation`, safeWrap(require('./conversationList').default))
  app.get(`/conversation/:id`, safeWrap(require('./conversationFind').default))
}
