import config from '@/config';
import { AuthToken } from '@/modules/auth/auth-token';

export const tenantSubdomain = {
  get isEnabled() {
    return config.tenantMode === 'multi-with-subdomain';
  },

  get isSubdomain() {
    return Boolean(this.fromLocationHref());
  },

  get isRootDomain() {
    return (
      config.tenantMode === 'multi-with-subdomain'
      && !this.fromLocationHref()
    );
  },

  fromLocationHref() {
    if (config.tenantMode !== 'multi-with-subdomain') {
      return null;
    }

    const hostSplitted = window.location.host.split('.');

    const currentHostDotsCount = hostSplitted.length;
    const domainDotsCount = config.frontendUrl.host.split('.').length;

    // The URL with subdomain must have at least one more dot then
    // the url without the subdomain
    if (currentHostDotsCount <= domainDotsCount) {
      return null;
    }

    const subdomain = hostSplitted[1]
      ? hostSplitted[0]
      : false;

    if (subdomain === 'www') {
      return false;
    }

    return subdomain;
  },

  fullTenantUrl(tenantUrl) {
    return `${config.frontendUrl.protocol}://${tenantUrl}.${config.frontendUrl.host}`;
  },

  isSubdomainOf(tenantUrl) {
    return this.fromLocationHref() === tenantUrl;
  },

  redirectAuthenticatedTo(tenantUrl) {
    if (this.isSubdomainOf(tenantUrl)) {
      return;
    }

    const token = AuthToken.get();

    // Clean the AuthToken of the Root Domain
    // to not redirect every time
    if (this.isRootDomain) {
      AuthToken.set(null, true);
    }

    window.location.href = `${this.fullTenantUrl(
      tenantUrl,
    )}?authToken=${token}`;
  },
};
