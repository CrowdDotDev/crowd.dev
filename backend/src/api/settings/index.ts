import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.put(`/tenant/:tenantId/settings`, safeWrap(require('./settingsSave').default))
  app.get(`/tenant/:tenantId/settings`, safeWrap(require('./settingsFind').default))

  app.get(
    '/tenant/:tenantId/settings/activity/types',
    safeWrap(require('./activityTypeList').default),
  )

  app.post(
    '/tenant/:tenantId/settings/activity/types',
    safeWrap(require('./activityTypeCreate').default),
  )

  app.put(
    '/tenant/:tenantId/settings/activity/types/:key',
    safeWrap(require('./activityTypeUpdate').default),
  )

  app.delete(
    '/tenant/:tenantId/settings/activity/types/:key',
    safeWrap(require('./activityTypeDestroy').default),
  )

  app.post(
    '/tenant/:tenantId/settings/members/attributes',
    safeWrap(require('./memberAttributeCreate').default),
  )
  app.delete(
    `/tenant/:tenantId/settings/members/attributes`,
    safeWrap(require('./memberAttributeDestroy').default),
  )
  app.put(
    `/tenant/:tenantId/settings/members/attributes/:id`,
    safeWrap(require('./memberAttributeUpdate').default),
  )
  app.get(
    `/tenant/:tenantId/settings/members/attributes`,
    safeWrap(require('./memberAttributeList').default),
  )
  app.get(
    `/tenant/:tenantId/settings/members/attributes/:id`,
    safeWrap(require('./memberAttributeFind').default),
  )
}
