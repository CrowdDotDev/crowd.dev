import config from '@/config';

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
};
