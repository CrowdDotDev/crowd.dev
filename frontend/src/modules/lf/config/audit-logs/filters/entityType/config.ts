import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import {
  SelectFilterConfig,
  SelectFilterOptions,
  SelectFilterValue,
} from '@/shared/modules/filters/types/filterTypes/SelectFilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import options from './options';

const entityType: SelectFilterConfig = {
  id: 'entityType',
  label: 'Entity type',
  iconClass: 'ri-shapes-line',
  type: FilterConfigType.SELECT,
  options: {
    options,
  },
  itemLabelRenderer(value: SelectFilterValue, options: SelectFilterOptions, data: any): string {
    return itemLabelRendererByType[FilterConfigType.SELECT]('Entity type', value, options, data);
  },
  apiFilterRenderer({ value, include }: SelectFilterValue): any[] {
    const filter = {
      entityType: { eq: value },
    };
    return [
      (include ? filter : { not: filter }),
    ];
  },
};

export default entityType;
