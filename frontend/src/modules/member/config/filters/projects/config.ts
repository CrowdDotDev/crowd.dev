import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { CustomFilterConfig } from '@/shared/modules/filters/types/filterTypes/CustomFilterConfig';

const projects: CustomFilterConfig = {
  id: 'projects',
  label: 'Projects',
  iconClass: 'ri-stack-line',
  featureFlag: 'projects-filter',
  inBody: true,
  type: FilterConfigType.CUSTOM,
  component: null,
  options: {
  },
  queryUrlParser({ value, include }: any): Record<string, any> {
    return {
      include: include === 'true',
      value: value.split(','),
    };
  },
  itemLabelRenderer(value: any, options: any): string {
    console.log(value, options);
    return 'Projects...';
  },
  apiFilterRenderer({ value }: any): any[] {
    return [
      { segments: value },
    ];
  },
};

export default projects;
