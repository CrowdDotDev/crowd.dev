import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import {
  MultiSelectAsyncFilterConfig, MultiSelectAsyncFilterOptions,
  MultiSelectAsyncFilterValue,
} from '@/shared/modules/filters/types/filterTypes/MultiSelectAsyncFilterConfig';
import { TagService } from '@/modules/tag/tag-service';

const tags: MultiSelectAsyncFilterConfig = {
  id: 'tags',
  label: 'Tags',
  iconClass: 'ri-price-tag-3-line',
  type: FilterConfigType.MULTISELECT_ASYNC,
  options: {
    remoteMethod: (query) => TagService.listAutocomplete(query, 10)
      .then((data: any[]) => data.map((tag) => ({
        label: tag.label,
        value: tag.id,
      }))),
    remotePopulateItems: (ids: string[]) => TagService.list({
      ids,
    }, null, ids.length, 0)
      .then(({ rows }: any) => rows.map((tag: any) => ({
        label: tag.name,
        value: tag.id,
      }))),
  },
  itemLabelRenderer(value: MultiSelectAsyncFilterValue, options: MultiSelectAsyncFilterOptions, data: any): string {
    return itemLabelRendererByType[FilterConfigType.MULTISELECT_ASYNC]('Tags', value, options, data);
  },
  apiFilterRenderer({ value, include }: MultiSelectAsyncFilterValue): any[] {
    const filter = { tags: value };
    return [
      (include ? filter : { not: filter }),
    ];
  },
};

export default tags;
