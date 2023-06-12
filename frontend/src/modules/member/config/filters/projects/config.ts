import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { CustomFilterConfig } from '@/shared/modules/filters/types/filterTypes/CustomFilterConfig';
import ProjectsFilter, { ProjectsFilterValue } from '@/modules/member/config/filters/projects/ProjectsFilter.vue';
import { LfService } from '@/modules/lf/segments/lf-segments-service';

const projects: CustomFilterConfig = {
  id: 'projects',
  label: 'Projects',
  iconClass: 'ri-stack-line',
  inBody: true,
  type: FilterConfigType.CUSTOM,
  component: ProjectsFilter,
  options: {
    remoteMethod: ({
      query,
      parentSlug,
    }) => LfService.queryProjects({
      limit: 10,
      filter: {
        name: query,
        parentSlug,
      },
    })
      .then(({ rows }: { rows: any[] }) => rows),
  },
  queryUrlParser({ value }: {value: string}): Record<string, any> {
    return {
      value: value.split(','),
    };
  },
  itemLabelRenderer({ value }: ProjectsFilterValue, options: any, data: any): string {
    let text = '';
    const charLimit = 30;

    if (!data.options?.length) {
      text = 'All';
    } else {
      data.options.forEach((project: any, i: number) => {
        if (project.children.length === project.selectedChildren.length) {
          text += `${project.label} (all sub-projects)`;
        } else if (project.selectedChildren.length) {
          text += project.selectedChildren.join(', ');
          text += ` (${project.label})`;
        }

        if (i !== data.options.length - 1) {
          text += ', ';
        }
      });
    }

    const trimmedValueText = text.length > charLimit ? `${text.substring(0, charLimit - 3)}...` : text;
    const tooltip = trimmedValueText.length < text.length ? `data-tooltip="${text}"` : '';

    return `<span ${tooltip}><b>Projects:</b>${trimmedValueText || '...'}</span>`;
  },
  apiFilterRenderer({ value }: any): any[] {
    console.log(value);
    return [
      { segments: value },
    ];
  },
};

export default projects;
