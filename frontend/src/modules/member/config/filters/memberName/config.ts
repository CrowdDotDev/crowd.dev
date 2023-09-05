import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import {
  StringFilterConfig,
  StringFilterOptions,
  StringFilterValue,
} from '@/shared/modules/filters/types/filterTypes/StringFilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import { apiFilterRendererByType } from '@/shared/modules/filters/config/apiFilterRendererByType';

const memberName: StringFilterConfig = {
  id: 'memberName',
  label: 'Member name',
  iconClass: 'ri-account-circle-line',
  type: FilterConfigType.STRING,
  options: {},
  itemLabelRenderer(
    value: StringFilterValue,
    options: StringFilterOptions,
  ): string {
    return itemLabelRendererByType[FilterConfigType.STRING](
      'Member name',
      value,
      options,
    );
  },
  apiFilterRenderer(value: StringFilterValue): any[] {
    return apiFilterRendererByType[FilterConfigType.STRING]('memberName', value);
  },
};

export default memberName;
