import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { CustomFilterConfig } from '@/shared/modules/filters/types/filterTypes/CustomFilterConfig';
import { MultiSelectFilterValue } from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';
import ChannelFilter from '@/modules/activity/config/filters/channel/ChannelFilter.vue';
import { queryUrlParserByType } from '@/shared/modules/filters/config/queryUrlParserByType';

const channel: CustomFilterConfig = {
  id: 'channel',
  label: 'Channel',
  iconClass: 'ri-discuss-line',
  type: FilterConfigType.CUSTOM,
  component: ChannelFilter,
  options: {
  },
  queryUrlParser: queryUrlParserByType[FilterConfigType.MULTISELECT],
  itemLabelRenderer(value: MultiSelectFilterValue): string {
    return `<b>Channel</b> ${value || '...'}`;
  },
  apiFilterRenderer(value): any[] {
    console.log(value);
    return [];
  },
};

export default channel;
