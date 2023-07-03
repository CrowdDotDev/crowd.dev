import { Filter, FilterConfig, FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { queryUrlParserByType } from '@/shared/modules/filters/config/queryUrlParserByType';
import { CustomFilterConfig } from '@/shared/modules/filters/types/filterTypes/CustomFilterConfig';
import { SavedViewsConfig } from '@/shared/modules/saved-views/types/SavedViewsConfig';

export const filterQueryService = () => {
  // Parses url query params and puts them in nested object format
  function parseQuery(query: Record<string, any>, config: Record<string, FilterConfig>, savedViewsConfig?: SavedViewsConfig) {
    const object: Record<string, any> = {};
    Object.entries(query).forEach(([key, value]) => {
      const [mainKey, subKey] = key.split('.');
      if (subKey) {
        // If nested value something.test=123 --> {something: {test: 123}}
        if (!(mainKey in object)) {
          object[mainKey] = {};
        }
        object[mainKey][subKey] = value;
      } else {
        // If value not nested something=123 --> {something: 123}
        object[mainKey] = value;
      }
    });
    // Url params come out as strings so we need to transform them to boolean, number or array
    Object.keys(object).forEach((key) => {
      if (key === 'settings' && savedViewsConfig) {
        Object.keys(object[key]).forEach((setting) => {
          object[key][setting] = savedViewsConfig.settings[setting].queryUrlParser(object[key][setting]);
        });
      } else if (key === 'pagination') {
        Object.keys(object[key]).forEach((paginationProperty) => {
          object[key][paginationProperty] = +object[key][paginationProperty];
        });
      } else if (key in config) {
        const { type } = config[key];
        const queryUrlParser = type === FilterConfigType.CUSTOM ? (config[key] as CustomFilterConfig).queryUrlParser : queryUrlParserByType[type];
        if (queryUrlParser) {
          object[key] = queryUrlParser(object[key]);
        }
      }
    });
    return object;
  }

  // Transforms value to be used in url query. Transforms array to string
  function setQueryValue(value: any) {
    if (Array.isArray(value)) {
      return value.join(',');
    }
    return value;
  }

  // Prepares query object to be only one level nested for query params to be more readable
  function setQuery(value: Filter) {
    const query: Record<string, any> = {};
    if (value) {
      const mappedValue = {
        ...value,
        pagination: {
          page: value.pagination?.page || 1,
          perPage: value.pagination?.perPage || 20,
        },
      };
      Object.entries(mappedValue).forEach(([key, filterValue]) => {
        if (typeof filterValue === 'object') {
          Object.entries(filterValue).forEach(([subKey, subFilterValue]) => {
            const value = setQueryValue(subFilterValue);
            if (value !== undefined) {
              query[`${key}.${subKey}`] = value;
            }
          });
        } else {
          const value = setQueryValue(filterValue);
          if (value !== undefined) {
            query[key] = value;
          }
        }
      });
    }

    return query;
  }

  return {
    parseQuery,
    setQuery,
  };
};
