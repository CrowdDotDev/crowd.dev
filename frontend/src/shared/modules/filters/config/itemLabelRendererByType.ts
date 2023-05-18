import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { booleanItemLabelRenderer } from './itemLabelRenderer/boolean.label.renderer';
import { numberItemLabelRenderer } from './itemLabelRenderer/number.label.renderer';
import { dateItemLabelRenderer } from './itemLabelRenderer/date.label.renderer';
import { selectItemLabelRenderer } from './itemLabelRenderer/select.label.renderer';
import {
  multiSelectItemLabelRenderer,
} from './itemLabelRenderer/multiselect.label.renderer';

export const itemLabelRendererByType: Record<FilterConfigType, (property: string, value: any) => string> = {
  [FilterConfigType.BOOLEAN]: booleanItemLabelRenderer,
  [FilterConfigType.NUMBER]: numberItemLabelRenderer,
  [FilterConfigType.DATE]: dateItemLabelRenderer,
  [FilterConfigType.SELECT]: selectItemLabelRenderer,
  [FilterConfigType.MULTISELECT]: multiSelectItemLabelRenderer,
  [FilterConfigType.CUSTOM]: () => '',
};
