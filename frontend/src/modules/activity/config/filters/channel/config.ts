import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { CustomFilterConfig } from '@/shared/modules/filters/types/filterTypes/CustomFilterConfig';
import { MultiSelectFilterValue } from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';
import ChannelFilter from '@/modules/activity/config/filters/channel/ChannelFilter.vue';

const channel: CustomFilterConfig = {
  id: 'channel',
  label: 'Channel',
  type: FilterConfigType.CUSTOM,
  component: ChannelFilter,
  options: {
  },
  itemLabelRenderer(value: MultiSelectFilterValue): string {
    return `<b>Channel</b> ${value || '...'}`;
  },
  queryRenderer(value: MultiSelectFilterValue): string {
    console.log(value);
    return '';
  },
};

export default channel;
