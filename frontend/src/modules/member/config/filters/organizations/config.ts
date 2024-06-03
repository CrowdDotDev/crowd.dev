import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import {
  MultiSelectAsyncFilterConfig,
  MultiSelectAsyncFilterOptions, MultiSelectAsyncFilterValue,
} from '@/shared/modules/filters/types/filterTypes/MultiSelectAsyncFilterConfig';
import { DEFAULT_ORGANIZATION_FILTERS } from '@/modules/organization/store/constants';
import { OrganizationService } from '@/modules/organization/organization-service';
import { trimAndReduceSpaces } from '@/utils/string';

const organizations: MultiSelectAsyncFilterConfig = {
  id: 'organizations',
  label: 'Organization',
  iconClass: 'ri-community-line',
  type: FilterConfigType.MULTISELECT_ASYNC,
  options: {
    remoteMethod: (query) => OrganizationService.query({
      filter: {
        or: [
          { displayName: { textContains: trimAndReduceSpaces(query) } },
        ],
      },
      limit: 10,
      segments: [],
    })
      .then(({ rows }: any) => rows.map((organization) => ({
        label: organization.displayName || organization.name,
        value: organization.id,
        prefix: `
            <span class="flex items-center justify-center w-6 h-6 p-1 mr-3 border rounded-md ">
            ${organization.logo
          ? `<img src="${organization.logo}" class="w-4 h-4 min-w-[16px]" alt="${organization.label}" />`
          : '<i v-else class="flex items-center justify-center w-4 h-4 text-gray-300 ri-community-line" />'}
            </span>`,
      }))),
    remotePopulateItems: (ids: string[]) => OrganizationService.query({
      filter: {
        and: [
          ...DEFAULT_ORGANIZATION_FILTERS,
          {
            id: { in: ids },
          },
        ],
      },
      limit: ids?.length,
      segments: [],
    })
      .then(({ rows }: any) => rows.map((organization: any) => ({
        label: organization.displayName,
        value: organization.id,
        logo: organization.logo,
      }))),
  },
  itemLabelRenderer(value: MultiSelectAsyncFilterValue, options: MultiSelectAsyncFilterOptions, data: any): string {
    return itemLabelRendererByType[FilterConfigType.MULTISELECT_ASYNC]('Organization', value, options, data);
  },
  apiFilterRenderer({ value, include }: MultiSelectAsyncFilterValue): any[] {
    const filter = {
      or: value.map((id) => ({ organizations: { eq: id } })),
    };
    return [
      (include ? filter : { not: filter }),
    ];
  },
};

export default organizations;
