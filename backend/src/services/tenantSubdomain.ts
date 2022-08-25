import { getConfig } from '../config'

export const tenantSubdomain = {
  frontendUrl(tenant) {
    const frontendUrlWithSubdomain = getConfig().FRONTEND_URL_WITH_SUBDOMAIN

    if (
      getConfig().TENANT_MODE !== 'multi-with-subdomain' ||
      !frontendUrlWithSubdomain ||
      !tenant ||
      !tenant.url
    ) {
      return getConfig().FRONTEND_URL
    }

    return frontendUrlWithSubdomain.replace('[subdomain]', tenant.url)
  },
}
