import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import {
  MultiSelectFilterConfig,
  MultiSelectFilterOptions,
  MultiSelectFilterValue,
} from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import { apiFilterRendererByType } from '@/shared/modules/filters/config/apiFilterRendererByType';

const identities: MultiSelectFilterConfig = {
  id: 'identities',
  label: 'Identities',
  iconClass: 'ri-fingerprint-line',
  type: FilterConfigType.MULTISELECT,
  options: {
    options: [
      {
        options: [
          ...(CrowdIntegrations.configs.map((platform) => ({
            label: (platform as any).name,
            value: platform.platform,
          }))),
        ],
      },
    ],
  },
  itemLabelRenderer(value: MultiSelectFilterValue, options: MultiSelectFilterOptions): string {
    return itemLabelRendererByType[FilterConfigType.MULTISELECT]('Identities', value, options);
  },
  apiFilterRenderer(value: MultiSelectFilterValue): any[] {
    return apiFilterRendererByType[FilterConfigType.MULTISELECT]('identities', value);
  },
};

export default identities;
