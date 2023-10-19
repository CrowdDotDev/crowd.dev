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
          {
            label: 'Email',
            value: 'emails',
          },
          ...(CrowdIntegrations.enabledConfigs.map((platform) => ({
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
  apiFilterRenderer({ value, include }: MultiSelectFilterValue): any[] {
    const platformIdentities = value.filter((identity) => identity !== 'emails');

    const emailFilter = value.filter((identity) => identity === 'emails');

    // Initialize an empty filter
    let filter = {};

    // Handle the conditions
    if (platformIdentities.length > 0 && emailFilter.length === 0) {
      // Only platforms selected
      filter = {
        or: platformIdentities.map((identity) => ({
          identities: { eq: identity },
        })),
      };
    } else if (platformIdentities.length === 0 && emailFilter.length > 0) {
      // Only emails selected
      filter = {
        emails: { ne: null },
      };
    } else if (platformIdentities.length > 0 && emailFilter.length > 0) {
      // Both platforms and emails selected
      filter = {
        // [
        or: [
          {
            or:
          platformIdentities.map((identity) => ({
            identities: { eq: identity },
          })),
          },

          { emails: { ne: null } },
        ],
      };
    }

    return [
      (include ? filter : { not: filter }),
    ];
  },
};

export default identities;
