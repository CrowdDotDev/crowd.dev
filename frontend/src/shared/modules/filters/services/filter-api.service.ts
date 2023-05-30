import { Filter, FilterConfig } from '@/shared/modules/filters/types/FilterConfig';
import { SearchFilterConfig } from '@/shared/modules/filters/types/filterTypes/SearchFilterConfig';
import { FilterQuery } from '@/shared/modules/filters/types/FilterQuery';
import { SavedViewsConfig } from '@/shared/modules/saved-views/types/SavedViewsConfig';

export const filterApiService = () => {
  function buildApiFilter(
    values: Filter,
    configuration: Record<string, FilterConfig>,
    searchConfig: SearchFilterConfig,
    savedViewsConfig?: SavedViewsConfig,
  ): FilterQuery {
    const {
      search,
      relation,
      order,
      pagination,
      settings,
      ...filterValues
    } = values;

    let baseFilters: any[] = [];
    let filters: any[] = [];

    // Search
    if (search && search.length > 0) {
      baseFilters = [
        ...baseFilters,
        ...searchConfig.apiFilterRenderer(search),
      ];
    }

    // Settings
    if (savedViewsConfig && settings) {
      Object.entries(settings).forEach(([setting, value]) => {
        const filter = savedViewsConfig.settings[setting]?.apiFilterRenderer(value);
        if (filter) {
          baseFilters = [
            ...baseFilters,
            ...filter,
          ];
        }
      });
    }

    // Filter values
    Object.entries(filterValues).forEach(([key, values]) => {
      const filter = configuration[key]?.apiFilterRenderer(values);
      if (filter && filter.length > 0) {
        filters = [
          ...filters,
          ...filter,
        ];
      }
    });

    // build object
    const filter = {
      and: [
        ...baseFilters,
        {
          [relation]: filters.length > 0 ? filters : undefined,
        },
      ],
    };

    const orderBy = `${order.prop}_${order.order === 'descending' ? 'DESC' : 'ASC'}`;

    const limit = pagination.perPage;
    const offset = (pagination.page - 1) * limit;

    return {
      filter,
      limit,
      offset,
      orderBy,
    };
  }

  return {
    buildApiFilter,
  };
};
