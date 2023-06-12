import { Project } from '@/modules/lf/segments/types/Segments';

export const filterLabel = (value: string[], options: Project[]) => {
  let text: string[] = [];

  if (!options?.length) {
    text = ['All'];
  } else {
    options.forEach((project) => {
      const selectedSubprojects = project.subprojects.filter(
        (sp) => value.includes(sp.id),
      ).map((sp) => sp.name);

      if (project.subprojects.length === selectedSubprojects.length) {
        text.push(`${project.name} (all sub-projects)`);
      } else if (selectedSubprojects.length) {
        text.push(`${selectedSubprojects.join(', ')} (${project.name})`);
      }
    });
  }

  return text.join(', ');
};
