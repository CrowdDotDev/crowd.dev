import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { BooleanFilterConfig } from '@/shared/modules/filters/types/filterTypes/BooleanFilterConfig';

const enrichedMember: BooleanFilterConfig = {
  id: 'enrichedMember',
  label: 'Enriched member',
  type: FilterConfigType.BOOLEAN,
  options: {},
  itemLabelRenderer(value): string {
    return `Enriched member ${value?.value ? 'True' : 'False'}`;
  },
  apiFilterRenderer(value): any[] {
    console.log(value);
    return [];
  },
};

export default enrichedMember;
