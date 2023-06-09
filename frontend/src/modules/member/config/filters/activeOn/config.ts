import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import {
  MultiSelectFilterConfig,
  MultiSelectFilterOptions,
  MultiSelectFilterValue,
} from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { apiFilterRendererByType } from '@/shared/modules/filters/config/apiFilterRendererByType';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';

const activeOn: MultiSelectFilterConfig = {
  id: 'activeOn',
  label: 'Active On',
  iconClass: 'ri-apps-2-line',
  type: FilterConfigType.MULTISELECT,
  options: {
    options: [
      {
        options: [
          ...(CrowdIntegrations.enabledConfigs.map((platform) => ({
            label: (platform as any).name,
            value: platform.platform,
          }))),
        ],
      },
    ],
  },
  itemLabelRenderer(value: MultiSelectFilterValue, options: MultiSelectFilterOptions): string {
    return itemLabelRendererByType[FilterConfigType.MULTISELECT]('Active on', value, options);
  },
  apiFilterRenderer(value: MultiSelectFilterValue): any[] {
    return apiFilterRendererByType[FilterConfigType.MULTISELECT]('activeOn', value);
  },
};

export default activeOn;
