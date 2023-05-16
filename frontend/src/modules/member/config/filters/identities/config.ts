import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { MultiSelectFilterConfig, MultiSelectFilterValue } from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';
import { CrowdIntegrations } from '@/integrations/integrations-config';

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
    return `Identities ${value?.value.join(',') || '...'}`;
  },
  apiFilterRenderer(value): any[] {
    console.log(value);
    return [];
  },
};

export default identities;
