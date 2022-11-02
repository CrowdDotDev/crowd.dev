import { useQuery } from 'h3';
import { SEARCH_ENGINE_CONVERSATIONS_INDEX } from '~~/helpers/config';
import initSearch from './helpers/initSearch';
import transform from './helpers/transform';
// import getTenant from "./helpers/getTenant";

const perPage = 10;

function stringToBoolean(str: string): boolean {
  switch (str.toLowerCase().trim()) {
    case 'true':
    case 'yes':
    case '1':
      return true;

    case 'false':
    case 'no':
    case '0':
    case null:
      return false;

    default:
      return Boolean(str);
  }
}

function getPagination(query) {
  const page = parseInt(query.page as string) || 1;
  const offset = (page - 1) * perPage;
  return { offset, limit: perPage };
}

function getFilter(query) {
  const tenantSlugFilter = `tenantSlug=${query.tenantSlug}`;
  return query.filter
    ? `${tenantSlugFilter} AND ${query.filter}`
    : tenantSlugFilter;
}

export default async (req) => {
  const query = useQuery(req);

  const filter = getFilter(query);

  const searchClient = initSearch();

  const results = await searchClient
    .index(SEARCH_ENGINE_CONVERSATIONS_INDEX)
    .search(query.q as string, {
      filter: filter,
      facetsDistribution: ['channel', 'platform'],
      sort: ['lastActive:desc'],
      attributesToRetrieve: ['*'],
      attributesToHighlight: ['*'],
      ...getPagination(query),
    });

  if (query.addView) {
    await searchClient
      .index(SEARCH_ENGINE_CONVERSATIONS_INDEX)
      .updateDocuments([
        {
          id: results.hits[0].id,
          views: (results.hits[0].views || 0) + 1,
        },
      ]);
  }

  return {
    conversations: transform(
      results.hits,
      stringToBoolean(query.highlightMatches as string)
    ),
    pagination: {
      hasNextPage: results.offset + perPage < results.nbHits,
      hasPreviousPage: results.offset > 0,
      showing: [results.offset, results.offset + perPage],
      total: results.nbHits,
    },

    filters: {
      platforms: Object.entries(results.facetsDistribution.platform).map(
        ([key, count]) => ({
          name: key,
          count: count,
          isActive: filter.includes(key) && filter.includes('platform'),
        })
      ),
      categories: Object.entries(results.facetsDistribution.channel).map(
        ([key, count]) => ({
          name: key,
          count: count,
          isActive: filter.includes(key) && filter.includes('channel'),
        })
      ),
    },
  };
};
