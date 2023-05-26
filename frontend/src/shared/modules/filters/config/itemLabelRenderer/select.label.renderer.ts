import {
  SelectFilterOptions,
  SelectFilterValue,
} from '@/shared/modules/filters/types/filterTypes/SelectFilterConfig';

export const selectItemLabelRenderer = (property: string, { value, include }: SelectFilterValue, options: SelectFilterOptions): string => {
  const excludeText = !include ? ' (exclude)' : '';
  const option = options.options.map((g) => g.options).flat().find((o) => o.value === value);
  return `<b>${property}${excludeText}:</b>${option?.label || value || '...'}`;
};
