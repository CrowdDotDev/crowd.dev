import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import { LfService } from '@/modules/lf/segments/lf-segments-service';
import {
  SelectAsyncFilterConfig, SelectAsyncFilterValue,
  SelectAsyncFilterOptions,
} from '@/shared/modules/filters/types/filterTypes/SelectAsyncFilterConfig';

const user: SelectAsyncFilterConfig = {
  id: 'user',
  label: 'User',
  iconClass: 'ri-account-circle-line',
  type: FilterConfigType.SELECT_ASYNC,
  options: {
    hideIncludeSwitch: true,
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
    remotePopulateItems: (id: string) => LfService.fetchUsers(
      {
        and: [
          {
            id: { eq: id },
          },
        ],
      },
      null,
      1,
      0,
    )
      .then(({ rows }: any) => {
        const [user] = rows;
        if (user) {
          return {
            label: user.fullName,
            value: user.id,
          };
        }
        return null;
      }),
  },
  itemLabelRenderer(value: SelectAsyncFilterValue, options: SelectAsyncFilterOptions, data: any): string {
    return itemLabelRendererByType[FilterConfigType.SELECT_ASYNC]('User', value, options, data);
  },
  apiFilterRenderer({ value }: SelectAsyncFilterValue): any[] {
    return [{
      userId: value,
    }];
  },
};

export default user;
