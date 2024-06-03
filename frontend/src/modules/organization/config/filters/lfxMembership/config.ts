import {
  BooleanFilterConfig,
  BooleanFilterOptions,
  BooleanFilterValue,
} from '@/shared/modules/filters/types/filterTypes/BooleanFilterConfig';
import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';

const location: BooleanFilterConfig = {
  id: 'lfxMembership',
  label: 'LF Member',
  iconClass: 'ri-star-line',
  type: FilterConfigType.BOOLEAN,
  options: {},
  itemLabelRenderer(value: BooleanFilterValue, options: BooleanFilterOptions): string {
    return itemLabelRendererByType[FilterConfigType.BOOLEAN]('LF Member', value, options);
  },
  apiFilterRenderer({ value }: BooleanFilterValue): any[] {
    const filter = {
      lfxMembership: {
        [value ? 'ne' : 'eq']: null,
      },
    };

    return [
      filter,
    ];
  },
};

export default location;
