export const getSegmentsFromProjectGroup = (projectGroup) => {
  if (!projectGroup) {
    return [];
  }

  return projectGroup.projects.reduce((acc, project) => {
    project.subprojects.forEach((subproject) => {
      acc.push(subproject.id);
    });

    return acc;
  }, []);
};
