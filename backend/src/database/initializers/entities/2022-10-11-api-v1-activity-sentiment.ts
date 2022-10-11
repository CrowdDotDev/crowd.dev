import { QueryTypes } from 'sequelize'
import TenantService from '../../../services/tenantService'
import SequelizeRepository from '../../repositories/sequelizeRepository'


/**
 * Since requests to aws activity sentiment api creates a bottleneck,
 * We'll be generating the sentiment for this month's activities only.
 */
export default async () => {
  let tenants = (await TenantService._findAndCountAllForEveryUser({ filter: {} })).rows
  tenants = [tenants[0]]
  
  const options = await SequelizeRepository.getDefaultIRepositoryOptions()

  const activityCountQuery = `select count(*) from activities a
                              where a."timestamp"  between '2022-09-01' and now() `

  const activityCount = (
    await options.database.sequelize.query(activityCountQuery, {
      type: QueryTypes.SELECT,
    })
  )[0].count
}
