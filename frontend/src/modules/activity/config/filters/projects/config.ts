import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import ProjectsFilter from '@/modules/member/config/filters/projects/ProjectsFilter.vue';
import { LfService } from '@/modules/lf/segments/lf-segments-service';
import { Project } from '@/modules/lf/segments/types/Segments';
import { ProjectsFilterValue, ProjectsCustomFilterConfig } from '@/modules/lf/segments/types/Filters';

const projects: ProjectsCustomFilterConfig = {
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
      .then(({ rows }) => rows),
  },
  queryUrlParser({ value }: {value: string}): Record<string, string[]> {
    return {
      value: value.split(','),
    };
  },
  itemLabelRenderer({ value }: ProjectsFilterValue, options: any, data: { options: Project[] }): string {
    let text = '';
    const charLimit = 30;

    if (!data.options?.length) {
      text = 'All';
    } else {
      data.options.forEach((project, i) => {
        const selectedSubprojects = project.subprojects.filter(
          (sp) => value.includes(sp.id),
        ).map((sp) => sp.name);

        if (project.subprojects.length === selectedSubprojects.length) {
          text += `${project.name} (all sub-projects)`;
        } else if (selectedSubprojects.length) {
          text += selectedSubprojects.join(', ');
          text += ` (${project.name})`;
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
  apiFilterRenderer({ value }: ProjectsFilterValue): any[] {
    return [
      { segments: value },
    ];
  },
};

export default projects;
