import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import {
  BooleanFilterConfig, BooleanFilterOptions,
  BooleanFilterValue,
} from '@/shared/modules/filters/types/filterTypes/BooleanFilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';

const enrichedOrganization: BooleanFilterConfig = {
  id: 'enrichedOrganization',
  label: 'Enriched organization',
  iconClass: 'ri-sparkling-line',
  type: FilterConfigType.BOOLEAN,
  options: {},
  itemLabelRenderer(value: BooleanFilterValue, options: BooleanFilterOptions): string {
    return itemLabelRendererByType[FilterConfigType.BOOLEAN]('Enriched organization', value, options);
  },
  apiFilterRenderer({ value, include }: BooleanFilterValue): any[] {
    const filter = {
      lastEnrichedAt: {
        [value ? 'ne' : 'eq']: null,
      },
    };
    return [
      (include ? filter : { not: filter }),
    ];
  },
};

export default enrichedOrganization;
