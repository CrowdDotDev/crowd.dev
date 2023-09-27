import { OrganizationMergeSuggestionType } from '@crowd/types'
import OrganizationService from '@/services/organizationService'
import track from '../../segment/track'

export default async (req, res) => {
  // new PermissionChecker(req).validateHas(Permissions.values.organizationEdit)

  const payload = await new OrganizationService(req).getMergeSuggestions(
    OrganizationMergeSuggestionType.SAME_IDENTITY,
  )

  track('Getting merge suggestions', { ...payload }, { ...req })

  const status = 200

  await req.responseHandler.success(req, res, payload, status)
}
