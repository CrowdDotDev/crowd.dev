import TenantService from '../../../services/tenantService'
import getUserContext from '../../utils/getUserContext'
import ReportService from '../../../services/reportService'

/* eslint-disable no-console */

export default async () => {
  const tenants = await TenantService._findAndCountAllForEveryUser({})

  // for each tenant
  for (const tenant of tenants.rows) {
    const userContext = await getUserContext(tenant.id)
    const rs = new ReportService(userContext)

    console.log(`Creating activities report for tenant ${tenant.id}`)
    await rs.create({
      name: 'Activities report',
      public: false,
      isTemplate: true,
    })
  }
}
