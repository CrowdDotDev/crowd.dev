import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import {
  MultiSelectFilterConfig,
  MultiSelectFilterOptions,
  MultiSelectFilterValue,
} from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';

const platform: MultiSelectFilterConfig = {
  id: 'platform',
  label: 'Platform',
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
          {
            label: 'Other',
            value: 'other',
          },
        ],
      },
    ],
  },
  itemLabelRenderer(value: MultiSelectFilterValue, options: MultiSelectFilterOptions, data: any): string {
    return itemLabelRendererByType[FilterConfigType.SELECT]('Platform', value, options, data);
  },
  apiFilterRenderer({ value, include }: MultiSelectFilterValue): any[] {
    const filter = {
      or: value.map((p) => ({ platform: p })),
    };
    return [
      (include ? filter : { not: filter }),
    ];
  },
};

export default platform;
