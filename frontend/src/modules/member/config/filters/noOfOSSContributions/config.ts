import { NumberFilterConfig } from '@/shared/modules/filters/types/filterTypes/NumberFilterConfig';
import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';

const noOfOSSContributions: NumberFilterConfig = {
  id: 'noOfOSSContributions',
  label: '# of open source contributions',
  type: FilterConfigType.NUMBER,
  options: {},
  itemLabelRenderer(value): string {
    return `# of open source contributions ${value?.value || '...'}`;
  },
  apiFilterRenderer({ value }): any[] {
    return [
      { numberOfOpenSourceContributions: { eq: value } },
    ];
  },
};

export default noOfOSSContributions;
