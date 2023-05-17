import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { MultiSelectFilterConfig, MultiSelectFilterValue } from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';
import { CrowdIntegrations } from '@/integrations/integrations-config';

const activeOn: MultiSelectFilterConfig = {
  id: 'activeOn',
  label: 'Active On',
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
    return `Active On ${value?.value.join(',') || '...'}`;
  },
  apiFilterRenderer(): any[] {
    return [];
  },
};

export default activeOn;
