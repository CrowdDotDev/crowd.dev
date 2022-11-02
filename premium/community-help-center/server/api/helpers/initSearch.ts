import { MeiliSearch } from 'meilisearch';
import { SEARCH_ENGINE_API_KEY, SEARCH_ENGINE_HOST } from '~~/helpers/config';

export default function initSearch() {
  return new MeiliSearch({
    host: SEARCH_ENGINE_HOST,
    apiKey: SEARCH_ENGINE_API_KEY,
  });
}
