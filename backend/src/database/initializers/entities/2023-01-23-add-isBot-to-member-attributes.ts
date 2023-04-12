import TenantService from '../../../services/tenantService'
import getUserContext from '../../utils/getUserContext'
import MemberAttributeSettingsService from '../../../services/memberAttributeSettingsService'
import { DefaultMemberAttributes } from '../../attributes/member/default'

/* eslint-disable no-console */

const addIsBotToMemberAttributes = async () => {
  const tenants = await TenantService._findAndCountAllForEveryUser({})
  const isBotAttributes = DefaultMemberAttributes.find((a) => a.name === 'isBot')

  // for each tenant
  for (const tenant of tenants.rows) {
    const userContext = await getUserContext(tenant.id)
    const memberAttributeSettingsService = new MemberAttributeSettingsService(userContext)

    console.log(`Creating isBot member attribute for tenant ${tenant.id}`)
    await memberAttributeSettingsService.create({
      name: isBotAttributes.name,
      label: isBotAttributes.label,
      type: isBotAttributes.type,
      canDelete: isBotAttributes.canDelete,
      show: isBotAttributes.show,
    })
  }
}

addIsBotToMemberAttributes()
