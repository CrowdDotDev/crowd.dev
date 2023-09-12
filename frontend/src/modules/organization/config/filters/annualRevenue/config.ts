import {
  NumberFilterConfig,
  NumberFilterValue,
} from '@/shared/modules/filters/types/filterTypes/NumberFilterConfig';
import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import AnnualRevenueFilter from '@/modules/organization/config/filters/annualRevenue/AnnualRevenueFilter.vue';
import {
  FilterNumberOperator,
  numberFilterOperators,
} from '@/shared/modules/filters/config/constants/number.constants';

const annualRevenue: NumberFilterConfig = {
  id: 'annualRevenue',
  label: 'Annual revenue',
  iconClass: 'ri-money-dollar-circle-line',
  type: FilterConfigType.CUSTOM,
  component: AnnualRevenueFilter,
  options: {},
  itemLabelRenderer({
    value, operator, valueTo, include,
  }: NumberFilterValue): string {
    const excludeText = !include ? ' (exclude)' : '';
    const operatorObject = numberFilterOperators.find((o) => o.value === operator);
    let operandText = (operatorObject?.subLabel ? `${operatorObject.subLabel} ` : `${operatorObject?.label} ` || '');

    if ([FilterNumberOperator.BETWEEN].includes(operator)) {
      operandText = '';
    }

    const parsedValue = `$${value}`;
    const parsedValueTo = `$${valueTo}`;

    const isBetween = [FilterNumberOperator.BETWEEN].includes(operator);
    const valueText = isBetween ? `${operandText}${parsedValue} - ${parsedValueTo}` : `${operandText}${parsedValue}`;

    return `<b>Annual revenue${excludeText}:</b>${valueText || '...'}`;
  },
  apiFilterRenderer({
    value, valueTo, operator, include,
  }: NumberFilterValue): any[] {
    const filterValue = [FilterNumberOperator.BETWEEN].includes(operator)
      ? [+value, +valueTo!]
      : +value;

    const filter = {
      revenueRange: {
        [operator]: filterValue,
      },
    };

    return [
      (include ? filter : {
        not: filter,
      }),
    ];
  },
};

export default annualRevenue;
