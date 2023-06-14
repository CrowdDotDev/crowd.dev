import { DEFAULT_MEMBER_ATTRIBUTES } from '@crowd/integrations'
import TenantService from '../../../services/tenantService'
import getUserContext from '../../utils/getUserContext'
import MemberAttributeSettingsService from '../../../services/memberAttributeSettingsService'

/* eslint-disable no-console */

const addIsOrganizationToMemberAttributes = async () => {
  const tenants = await TenantService._findAndCountAllForEveryUser({})
  const isOrganizationAttribute = DEFAULT_MEMBER_ATTRIBUTES.find((a) => a.name === 'isOrganization')

  // for each tenant
  for (const tenant of tenants.rows) {
    const userContext = await getUserContext(tenant.id)
    const mas = new MemberAttributeSettingsService(userContext)

    // check already exists
    const attrs = await mas.findAndCountAll({ filter: { name: isOrganizationAttribute.name } })

    if (attrs.count === 0) {
      console.log(`Creating isOrganization member attribute for tenant ${tenant.id}`)
      await mas.create({
        name: isOrganizationAttribute.name,
        label: isOrganizationAttribute.label,
        type: isOrganizationAttribute.type,
        canDelete: isOrganizationAttribute.canDelete,
        show: isOrganizationAttribute.show,
      })
    }
  }
}

addIsOrganizationToMemberAttributes()
