import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { BooleanFilterConfig } from '@/shared/modules/filters/types/filterTypes/BooleanFilterConfig';

const enrichedMember: BooleanFilterConfig = {
  id: 'enrichedMember',
  label: 'Enriched member',
  type: FilterConfigType.BOOLEAN,
  options: {},
  itemLabelRenderer(value): string {
    return `<b>Enriched member</b> ${value?.value ? 'True' : 'False'}`;
  },
  queryRenderer(value) {
    return {
      activityCount: value,
    };
  },
};

export default enrichedMember;
