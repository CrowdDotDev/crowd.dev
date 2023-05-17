import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { MultiSelectFilterConfig, MultiSelectFilterValue } from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import { apiFilterRendererByType } from '@/shared/modules/filters/config/apiFilterRendererByType';

const identities: MultiSelectFilterConfig = {
  id: 'identities',
  label: 'Identities',
  type: FilterConfigType.MULTISELECT,
  options: {
    options: [
      {
        label: '',
        options: [
          ...(CrowdIntegrations.configs.map((platform) => ({
            label: (platform as any).name,
            value: platform.platform,
          }))),
        ],
      },
    ],
  },
  itemLabelRenderer(value: MultiSelectFilterValue): string {
    return itemLabelRendererByType[FilterConfigType.MULTISELECT]('Identities', value);
  },
  apiFilterRenderer(value: MultiSelectFilterValue): any[] {
    return apiFilterRendererByType[FilterConfigType.MULTISELECT]('identities', value);
  },
};

export default identities;
