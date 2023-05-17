import { LfService } from '@/modules/lf/segments/lf-segments-service';
import Message from '@/shared/message/message';

export default {
  // Project Groups
  listProjectGroups(data) {
    return LfService.queryProjectGroups(data).then(
      (projectGroups) => {
        this.projectGroups = projectGroups;
      },
    );
  },
  createProjectGroup(data) {
    LfService.createProjectGroup(data).then(() => {
      Message.success('Project Group created successfully');
    }).catch(() => {
      Message.error('Something went wrong while creating the project group');
    });
  },
  getProjectGroup(id) {
    return LfService.findProjectGroup(id).then((projectGroup) => Promise.resolve(projectGroup));
  },
  updateProjectGroup(id, data) {
    LfService.updateProjectGroup(id, data).then(() => {
      Message.success('Project Group updated successfully');
    }).catch(() => {
      Message.error('Something went wrong while updating the project group');
    });
  },
  // Projects
  createProject(data) {
    LfService.createProject(data).then(() => {
      Message.success('Project created successfully');
    }).catch(() => {
      Message.error('Something went wrong while creating the project');
    });
  },
  // Sub-projects
  createSubProject(data) {
    LfService.createSubProject(data).then(() => {
      Message.success('Sub-project created successfully');
    }).catch(() => {
      Message.error('Something went wrong while creating the sub-project');
    });
  },
};
