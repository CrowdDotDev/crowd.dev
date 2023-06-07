import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { stringItemLabelRenderer } from '@/shared/modules/filters/config/itemLabelRenderer/string.label.renderer';
import {
  multiSelectAsyncItemLabelRenderer,
} from '@/shared/modules/filters/config/itemLabelRenderer/multiselectasync.label.renderer';
import { booleanItemLabelRenderer } from './itemLabelRenderer/boolean.label.renderer';
import { numberItemLabelRenderer } from './itemLabelRenderer/number.label.renderer';
import { dateItemLabelRenderer } from './itemLabelRenderer/date.label.renderer';
import { selectItemLabelRenderer } from './itemLabelRenderer/select.label.renderer';
import {
  multiSelectItemLabelRenderer,
} from './itemLabelRenderer/multiselect.label.renderer';

export const itemLabelRendererByType: Record<FilterConfigType, (
  property: string,
  value: any,
  options: any,
  data?: any,
  renderOptions?: any
) => string> = {
  [FilterConfigType.BOOLEAN]: booleanItemLabelRenderer,
  [FilterConfigType.NUMBER]: numberItemLabelRenderer,
  [FilterConfigType.DATE]: dateItemLabelRenderer,
  [FilterConfigType.SELECT]: selectItemLabelRenderer,
  [FilterConfigType.MULTISELECT]: multiSelectItemLabelRenderer,
  [FilterConfigType.MULTISELECT_ASYNC]: multiSelectAsyncItemLabelRenderer,
  [FilterConfigType.STRING]: stringItemLabelRenderer,
  [FilterConfigType.CUSTOM]: () => '',
};
