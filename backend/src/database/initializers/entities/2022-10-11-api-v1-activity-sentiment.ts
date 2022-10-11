import TenantService from '../../../services/tenantService'

/**
 * Since requests to aws activity sentiment api creates a bottleneck,
 * We'll be generating the sentiment for this month's activities only.
 */
export default async () => {
    let tenants = (await TenantService._findAndCountAllForEveryUser({ filter: {} })).rows
    tenants = [tenants[0]]

    const activityCountQuery = `select count(*) from activities a`

    const activityCount = (
      await options.database.sequelize.query(activityCountQuery, {
        type: QueryTypes.SELECT,
      })
    )[0].count



}