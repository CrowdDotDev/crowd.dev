export const getSegmentsFromProjectGroup = (projectGroup) => projectGroup.projects.reduce((acc, project) => {
  project.subprojects.forEach((subproject) => {
    acc.push(subproject.id);
  });

  return acc;
}, []);
