import { NumberFilterConfig, NumberFilterValue } from '@/shared/modules/filters/types/filterTypes/NumberFilterConfig';
import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import { apiFilterRendererByType } from '@/shared/modules/filters/config/apiFilterRendererByType';

const noOfOSSContributions: NumberFilterConfig = {
  id: 'noOfOSSContributions',
  label: '# of open source contributions',
  type: FilterConfigType.NUMBER,
  options: {},
  itemLabelRenderer(value: NumberFilterValue): string {
    return itemLabelRendererByType[FilterConfigType.NUMBER]('# of OSS contributions', value);
  },
  apiFilterRenderer(value: NumberFilterValue): any[] {
    return apiFilterRendererByType[FilterConfigType.NUMBER]('numberOfOpenSourceContributions', value);
  },
};

export default noOfOSSContributions;
