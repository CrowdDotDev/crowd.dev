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
    remoteMethod: (query) => {
      console.log(query);
      return LfService.fetchUsers({
        fullName: query,
        email: query,
      }, null, 10)

        .then(({ rows }: any) => rows.map((user: any) => ({
          label: user.fullName,
          description: `${user.email}`,
          value: user.id,
        })));
    },
    remotePopulateItems: (id: string) => LfService.getUser(id)
      .then((data: any) => ({
        label: data.fullName,
        value: data.id,
      })),
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
