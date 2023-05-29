import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import {
  MultiSelectFilterConfig,
  MultiSelectFilterOptions,
  MultiSelectFilterValue,
} from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';

const segment: MultiSelectFilterConfig = {
  id: 'segment',
  label: 'Segments',
  iconClass: 'ri-apps-2-line',
  inBody: true,
  type: FilterConfigType.MULTISELECT,
  options: {
    hideIncludeSwitch: true,
    // TODO: set segments options
    options: [
      {
        options: [
          {
            label: 'Segment 1',
            value: 'segment1',
          },
        ],
      },
    ],
  },
  itemLabelRenderer(value: MultiSelectFilterValue, options: MultiSelectFilterOptions): string {
    return itemLabelRendererByType[FilterConfigType.MULTISELECT]('Segments', value, options);
  },
  apiFilterRenderer({ value }: MultiSelectFilterValue): any[] {
    return [
      { segments: value },
    ];
  },
};

export default segment;
