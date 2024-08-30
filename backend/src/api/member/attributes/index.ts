import { safeWrap } from '@/middlewares/errorMiddleware'

export default (app) => {
  // Member Attributes
  app.get(
    `/tenant/:tenantId/member/:memberId/attributes`,
    safeWrap(require('./memberAttributesList').default),
  )

  // Member Attributes Update
  app.patch(
    `/tenant/:tenantId/member/:memberId/attributes`,
    safeWrap(require('./memberAttributesUpdate').default),
  )
}
