import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import {
  MultiSelectAsyncFilterConfig,
  MultiSelectAsyncFilterOptions, MultiSelectAsyncFilterValue,
} from '@/shared/modules/filters/types/filterTypes/MultiSelectAsyncFilterConfig';
import { OrganizationService } from '@/modules/organization/organization-service';
import { DEFAULT_ORGANIZATION_FILTERS } from '@/modules/organization/store/constants';

const organizations: MultiSelectAsyncFilterConfig = {
  id: 'organizations',
  label: 'Organization',
  iconClass: 'ri-community-line',
  type: FilterConfigType.MULTISELECT_ASYNC,
  options: {
    remoteMethod: (query) => OrganizationService.listAutocomplete(query, 10)
      .then((data: any[]) => data.map((organization) => ({
        label: organization.label,
        value: organization.id,
        logo: organization.logo,
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
      orderBy: 'displayName_ASC',
      limit: ids.length,
      offset: 0,
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
      organizationId: { in: value },
    };
    return [
      (include ? filter : { not: filter }),
    ];
  },
};

export default organizations;
