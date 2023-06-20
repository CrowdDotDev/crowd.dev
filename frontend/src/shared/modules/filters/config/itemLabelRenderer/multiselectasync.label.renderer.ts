import {
  MultiSelectAsyncFilterOption,
  MultiSelectAsyncFilterOptions,
  MultiSelectAsyncFilterValue,
} from '@/shared/modules/filters/types/filterTypes/MultiSelectAsyncFilterConfig';

export const multiSelectAsyncItemLabelRenderer = (
  property: string,
  { value, include }: MultiSelectAsyncFilterValue,
  options: MultiSelectAsyncFilterOptions,
  data: any,
): string => {
  const excludeText = !include ? ' (exclude)' : '';

  const charLimit = 30;

  const labelObject = ((data?.selected || []) as MultiSelectAsyncFilterOption[])
    .filter((option) => value.includes(option.value))
    .reduce((obj, option) => {
      // eslint-disable-next-line no-param-reassign
      obj[option.value] = option.label;
      return obj;
    }, {} as Record<string, string>);

  const valueText = value.filter((val) => !!labelObject[val]).map((val) => labelObject[val] || undefined).join(', ');
  const trimmedValueText = valueText.length > charLimit ? `${valueText.substring(0, charLimit - 3)}...` : valueText;
  const tooltip = trimmedValueText.length < valueText.length ? `data-tooltip="${valueText}"` : '';
  return `<span ${tooltip}><b>${property}${excludeText}:</b>${trimmedValueText || '...'}</span>`;
};
