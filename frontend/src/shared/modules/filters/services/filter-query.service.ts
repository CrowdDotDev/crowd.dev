import { Filter, FilterConfig } from '@/shared/modules/filters/types/FilterConfig';
import { queryUrlParserByType } from '@/shared/modules/filters/config/queryUrlParserByType';
import { CustomFilterConfig } from '@/shared/modules/filters/types/filterTypes/CustomFilterConfig';

export const filterQueryService = () => {
  function parseQuery(query: Record<string, any>, config: Record<string, FilterConfig>) {
    const object: Record<string, any> = {};
    Object.entries(query).forEach(([key, value]) => {
      const [mainKey, subKey] = key.split('.');
      if (subKey) {
        if (!(mainKey in object)) {
          object[mainKey] = {};
        }
        object[mainKey][subKey] = value;
      } else {
        object[mainKey] = value;
      }
    });
    Object.keys(object).forEach((key) => {
      if (key in config) {
        const { type } = config[key];
        const queryUrlParser = queryUrlParserByType[type] ?? (config[key] as CustomFilterConfig).queryUrlParser;
        if (queryUrlParser) {
          object[key] = queryUrlParser(object[key]);
        }
      }
    });
    return object;
  }

  function setQueryValue(value: any) {
    if (Array.isArray(value)) {
      return value.join(',');
    }
    return value;
  }

  function setQuery(value: Filter) {
    const query: Record<string, any> = {};
    Object.entries(value).forEach(([key, filterValue]) => {
      if (typeof filterValue === 'object') {
        Object.entries(filterValue).forEach(([subKey, subFilterValue]) => {
          query[`${key}.${subKey}`] = setQueryValue(subFilterValue);
        });
      } else {
        query[key] = setQueryValue(filterValue);
      }
    });
    return query;
  }

  return {
    parseQuery,
    setQuery,
  };
};
