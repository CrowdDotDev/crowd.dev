import { safeWrap } from '@/middlewares/errorMiddleware'

export default (app) => {
  // Member Attributes
  app.get(`/member/:memberId/attributes`, safeWrap(require('./memberAttributesList').default))

  // Member Attributes Update
  app.patch(`/member/:memberId/attributes`, safeWrap(require('./memberAttributesUpdate').default))
}
