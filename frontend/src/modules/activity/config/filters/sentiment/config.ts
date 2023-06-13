import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import {
  MultiSelectFilterConfig,
  MultiSelectFilterOptions,
  MultiSelectFilterValue,
} from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import options from './options';

const sentiment: MultiSelectFilterConfig = {
  id: 'sentiment',
  label: 'Sentiment',
  iconClass: 'ri-speed-up-line',
  type: FilterConfigType.MULTISELECT,
  options: {
    options,
  },
  itemLabelRenderer(value: MultiSelectFilterValue, options: MultiSelectFilterOptions): string {
    return itemLabelRendererByType[FilterConfigType.MULTISELECT]('Sentiment', value, options);
  },
  apiFilterRenderer({ value, include }: MultiSelectFilterValue): any[] {
    const filter = {
      or: [
        ...(value.includes('positive') ? [{ sentiment: { gte: 67 } }] : []),
        ...(value.includes('negative') ? [{ sentiment: { lt: 33 } }] : []),
        ...(value.includes('neutral') ? [{ sentiment: { between: [33, 67] } }] : []),
      ],
    };
    return [
      (include ? filter : { not: filter }),
    ];
  },
};

export default sentiment;
