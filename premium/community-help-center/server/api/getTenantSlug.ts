import { APP_DOMAIN, SEARCH_ENGINE_SETTINGS_INDEX } from '~~/helpers/config';
import initSearch from './helpers/initSearch';

async function getTenant(searchClient, tenantSlug) {
  const tenant = await searchClient
    .index(SEARCH_ENGINE_SETTINGS_INDEX)
    .search('', {
      filter: `tenantSlug=${tenantSlug}`,
    });

  const defaultStyles = {
    primary: '#e94f2e',
    secondary: '#140505',
    text: '#140505',
    textSecondary: '#7f7f7f',
    textCta: '#fff',
    bg: '#f8f8f8',
    bgHighlight: '#fff',
    bgNav: '#140505',
  };
  let styles = defaultStyles;
  if (tenant && tenant.hits && tenant.hits.length > 0 && tenant.hits[0].theme) {
    styles = tenant.hits[0].theme;
  }

  return {
    tenant: tenant.hits && tenant.hits[0] ? tenant.hits[0] : undefined,
    styles,
  };
}

async function getTenantSlugAndMode(searchClient, req) {
  const query = useQuery(req);

  const request = req.req

  if (request.headers || request.headers.host) {
    const hostArray = request.headers.host.split('.');
    const domain =
      hostArray.length === 2 ? hostArray[0] : hostArray[hostArray.length - 2];

    if (
      request.headers.host === APP_DOMAIN ||
      request.headers.host.includes('open-crowd.netlify.app') ||
      request.headers.host.includes('open-crowd-prod.netlify.app')
    ) {
      return {
        mode: 'urlPath',
        tenantSlug: query.slug,
      };
    } else if (domain === 'crowd' || domain === 'localhost:3000') {
      return {
        mode: 'subdomain',
        tenantSlug: hostArray[0],
      };
    } else {
      const results = await searchClient
        .index(SEARCH_ENGINE_SETTINGS_INDEX)
        .search('', { filter: `customUrl=${request.headers.host.split(':')[0]}` });
      return {
        mode: 'subdomain',
        tenantSlug: results.hits[0].tenantSlug,
      };
    }
  }
}

export default async (req, res) => {
  const searchClient = initSearch();
  const { tenantSlug, mode } = await getTenantSlugAndMode(searchClient, req);
  const { tenant, styles } = await getTenant(searchClient, tenantSlug);

  return {
    tenantSlug: tenantSlug || undefined,
    mode,
    tenant: tenant || undefined,
    styles,
  };
};
