import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import {
  MultiSelectAsyncFilterConfig,
  MultiSelectAsyncFilterOptions, MultiSelectAsyncFilterValue,
} from '@/shared/modules/filters/types/filterTypes/MultiSelectAsyncFilterConfig';
import { LfService } from '@/modules/lf/segments/lf-segments-service';

const user: MultiSelectAsyncFilterConfig = {
  id: 'user',
  label: 'User',
  iconClass: 'ri-account-circle-line',
  type: FilterConfigType.MULTISELECT_ASYNC,
  options: {
    remoteMethod: (query) => LfService.fetchUsers({
      or: [
        { fullName: { textContains: query } },
        { email: { textContains: query } },
        { id: { eq: query } },
      ],
    }, null, 10)

      .then(({ rows }: any) => rows.map((user: any) => ({
        label: user.fullName,
        description: `${user.email}`,
        value: user.id,
      }))),
    remotePopulateItems: (ids: string[]) => LfService.fetchUsers(
      {
        and: [
          {
            id: { in: ids },
          },
        ],
      },
      null,
      ids.length,
      0,
    )
      .then(({ rows }: any) => rows.map((member: any) => ({
        label: member.displayName,
        value: member.id,
      }))),
  },
  itemLabelRenderer(value: MultiSelectAsyncFilterValue, options: MultiSelectAsyncFilterOptions, data: any): string {
    return itemLabelRendererByType[FilterConfigType.MULTISELECT_ASYNC]('User', value, options, data);
  },
  apiFilterRenderer({ value, include }: MultiSelectAsyncFilterValue): any[] {
    const filter = {
      userId: { in: value },
    };
    return [
      (include ? filter : { not: filter }),
    ];
  },
};

export default user;
