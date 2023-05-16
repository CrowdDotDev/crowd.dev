import { Filter, FilterConfig } from '@/shared/modules/filters/types/FilterConfig';
import { SearchFilterConfig } from '@/shared/modules/filters/types/filterTypes/SearchFilterConfig';
import { FilterQuery } from '@/shared/modules/filters/types/FilterQuery';

export const filterApiService = () => {
  function buildApiFilter(values: Filter, configuration: Record<string, FilterConfig>, searchConfig: SearchFilterConfig): FilterQuery {
    const {
      search,
      relation,
      order,
      pagination,
      config,
      ...rest
    } = values;

    // Remove when saved views done
    console.log(config);

    let baseFilters: any[] = [];
    let filters: any[] = [];

    if (search.length > 0) {
      baseFilters = [
        ...baseFilters,
        ...searchConfig.apiFilterRenderer(search),
      ];
    }

    // TODO: config filter parsing

    Object.entries(rest).forEach(([key, values]) => {
      const filter = configuration[key]?.apiFilterRenderer(values);
      if (filter && filter.length > 0) {
        filters = [
          ...filters,
          ...filter,
        ];
      }
    });

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
