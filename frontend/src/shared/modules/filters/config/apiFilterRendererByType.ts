import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { booleanApiFilterRenderer } from './apiFilterRenderer/boolean.filter.renderer';
import { numberApiFilterRenderer } from './apiFilterRenderer/number.filter.renderer';
import { dateApiFilterRenderer } from './apiFilterRenderer/date.filter.renderer';
import { selectApiFilterRenderer } from './apiFilterRenderer/select.filter.renderer';
import {
  multiSelectApiFilterRenderer,
} from './apiFilterRenderer/multiselect.filter.renderer';

export const apiFilterRendererByType: Record<FilterConfigType, (property: string, value: any) => any[]> = {
  [FilterConfigType.BOOLEAN]: booleanApiFilterRenderer,
  [FilterConfigType.NUMBER]: numberApiFilterRenderer,
  [FilterConfigType.DATE]: dateApiFilterRenderer,
  [FilterConfigType.SELECT]: selectApiFilterRenderer,
  [FilterConfigType.MULTISELECT]: multiSelectApiFilterRenderer,
  [FilterConfigType.CUSTOM]: () => [],
};
