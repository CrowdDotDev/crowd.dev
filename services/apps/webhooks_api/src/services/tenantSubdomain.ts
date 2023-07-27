import { API_CONFIG, TENANT_MODE } from '../conf'
import { TenantMode } from '../conf/configTypes'

export const tenantSubdomain = {
  frontendUrl(tenant) {
    const frontendUrlWithSubdomain = API_CONFIG.frontendUrlWithSubdomain

    if (
      TENANT_MODE !== TenantMode.MULTI_WITH_SUBDOMAIN ||
      !frontendUrlWithSubdomain ||
      !tenant ||
      !tenant.url
    ) {
      return API_CONFIG.frontendUrl
    }

    return frontendUrlWithSubdomain.replace('[subdomain]', tenant.url)
  },
}
