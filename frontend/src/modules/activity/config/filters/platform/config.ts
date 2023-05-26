import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { MultiSelectFilterConfig, MultiSelectFilterValue } from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';
import { CrowdIntegrations } from '@/integrations/integrations-config';

const platform: MultiSelectFilterConfig = {
  id: 'platform',
  label: 'Platform',
  iconClass: 'ri-apps-2-line',
  type: FilterConfigType.MULTISELECT,
  options: {
    options: [
      {
        options: [
          ...(CrowdIntegrations.configs.map((platform) => ({
            label: (platform as any).name,
            value: platform.platform,
          }))),
          {
            label: 'Other',
            value: 'other',
          },
        ],
      },
    ],
  },
  itemLabelRenderer(value: MultiSelectFilterValue): string {
    return `<b>Platform</b> ${value?.value.join(',') || '...'}`;
  },
  apiFilterRenderer(value): any[] {
    console.log(value);
    return [];
  },
};

export default platform;
