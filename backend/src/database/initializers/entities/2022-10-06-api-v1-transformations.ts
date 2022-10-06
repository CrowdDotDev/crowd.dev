import TenantService from '../../../services/tenantService'
import getUserContext from '../../utils/getUserContext'
import ActivityService from '../../../services/activityService'
import SequelizeRepository from '../../repositories/sequelizeRepository'
import { PlatformType } from '../../../utils/platforms'

export default async () => {
  const tenants = (await TenantService._findAndCountAllForEveryUser({ filter: {} })).rows

  for (const tenant of tenants) {
    console.log('processing tenant: ', tenant.id)
  }
}
