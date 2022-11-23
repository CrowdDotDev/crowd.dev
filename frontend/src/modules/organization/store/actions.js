import { OrganizationService } from '@/modules/organization/organization-service'
import sharedActions from '@/shared/store/actions'

export default {
  ...sharedActions('organization', OrganizationService)
}
