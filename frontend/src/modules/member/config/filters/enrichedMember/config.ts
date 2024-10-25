import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import {
  BooleanFilterConfig, BooleanFilterOptions,
  BooleanFilterValue,
} from '@/shared/modules/filters/types/filterTypes/BooleanFilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';

const enrichedMember: BooleanFilterConfig = {
  id: 'enrichedMember',
  label: 'Enriched profile',
  iconClass: 'sparkles fa-regular',
  type: FilterConfigType.BOOLEAN,
  options: {},
  itemLabelRenderer(value: BooleanFilterValue, options: BooleanFilterOptions): string {
    return itemLabelRendererByType[FilterConfigType.BOOLEAN]('Enriched profile', value, options);
  },
  apiFilterRenderer({ value, include }: BooleanFilterValue): any[] {
    const filter = {
      lastEnriched: {
        [value ? 'eq' : 'ne']: null,
      },
    };
    return [
      (include ? filter : { not: filter }),
    ];
  },
};

export default enrichedMember;
