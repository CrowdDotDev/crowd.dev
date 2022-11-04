import { SEARCH_ENGINE_SETTINGS_INDEX } from '~~/helpers/config';
import initSearch from './helpers/initSearch';

export default async (req) => {
  const searchClient = initSearch();

  const results = await searchClient
    .index(SEARCH_ENGINE_SETTINGS_INDEX)
    .search('', {});
  return results.hits.filter((t) => t.tenantSlug !== 'dev-founders');
};
