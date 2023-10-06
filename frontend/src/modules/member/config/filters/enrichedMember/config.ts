import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import {
  BooleanFilterConfig, BooleanFilterOptions,
  BooleanFilterValue,
} from '@/shared/modules/filters/types/filterTypes/BooleanFilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';

const enrichedMember: BooleanFilterConfig = {
  id: 'enrichedMember',
  label: 'Enriched contact',
  iconClass: 'ri-sparkling-line',
  type: FilterConfigType.BOOLEAN,
  options: {},
  itemLabelRenderer(value: BooleanFilterValue, options: BooleanFilterOptions): string {
    return itemLabelRendererByType[FilterConfigType.BOOLEAN]('Enriched contact', value, options);
  },
  apiFilterRenderer({ value, include }: BooleanFilterValue): any[] {
    const filter = {
      lastEnriched: {
        [value ? 'ne' : 'eq']: null,
      },
    };
    return [
      (include ? filter : { not: filter }),
    ];
  },
};

export default enrichedMember;
