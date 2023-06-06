import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { CustomFilterConfig } from '@/shared/modules/filters/types/filterTypes/CustomFilterConfig';
import ChannelFilter from '@/modules/activity/config/filters/channel/ChannelFilter.vue';
import { queryUrlParserByType } from '@/shared/modules/filters/config/queryUrlParserByType';
import { SelectFilterOptions, SelectFilterValue } from '@/shared/modules/filters/types/filterTypes/SelectFilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';

const channel: CustomFilterConfig = {
  id: 'channel',
  label: 'Channel',
  iconClass: 'ri-discuss-line',
  type: FilterConfigType.CUSTOM,
  component: ChannelFilter,
  options: {
  },
  queryUrlParser: queryUrlParserByType[FilterConfigType.SELECT],
  itemLabelRenderer(value: SelectFilterValue, options: SelectFilterOptions, data: any): string {
    return itemLabelRendererByType[FilterConfigType.SELECT]('Channel', value, data);
  },
  apiFilterRenderer({ value, include }:SelectFilterValue): any[] {
    const filter = {
      channel: value,
    };
    return [
      (include ? filter : { not: filter }),
    ];
  },
};

export default channel;
