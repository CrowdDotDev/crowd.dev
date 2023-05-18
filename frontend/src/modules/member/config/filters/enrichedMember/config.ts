import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import {
  BooleanFilterConfig,
  BooleanFilterValue,
} from '@/shared/modules/filters/types/filterTypes/BooleanFilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import { apiFilterRendererByType } from '@/shared/modules/filters/config/apiFilterRendererByType';

const enrichedMember: BooleanFilterConfig = {
  id: 'enrichedMember',
  label: 'Enriched member',
  type: FilterConfigType.BOOLEAN,
  options: {},
  itemLabelRenderer(value: BooleanFilterValue): string {
    return itemLabelRendererByType[FilterConfigType.BOOLEAN]('Enriched member', value);
  },
  apiFilterRenderer(value: BooleanFilterValue): any[] {
    return apiFilterRendererByType[FilterConfigType.BOOLEAN]('lastEnriched', value);
  },
};

export default enrichedMember;
