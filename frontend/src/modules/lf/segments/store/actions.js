import { LfService } from '@/modules/lf/segments/lf-segments-service';
import Message from '@/shared/message/message';

export default {
  // Project Groups
  listProjectGroups() {
    return LfService.queryProjectGroups({
      limit: this.projectGroups.pagination.pageSize,
      offset: this.offset,
      filter: {
        name: this.searchProjectGroups,
      },
    })
      .then((response) => {
        const count = Number(response.count);

        this.projectGroups.list = response.rows;

        if (!this.searchProjectGroups) {
          this.projectGroups.pagination.total = count;
        }

        this.projectGroups.pagination.count = count;
      })
      .catch(() => {
        Message.error('Something went wrong while fetching project groups');
      })
      .finally(() => Promise.resolve());
  },
  findProjectGroup(id) {
    return LfService.findSegment(id)
      .then((projectGroup) => Promise.resolve(projectGroup))
      .catch(() => {
        Message.error('Something went wrong while getting the project group');
        Promise.resolve();
      });
  },
  createProjectGroup(data) {
    return LfService.createProjectGroup(data)
      .then(() => {
        Message.success('Project Group created successfully');
        this.listProjectGroups();
      })
      .catch(() => {
        Message.error('Something went wrong while creating the project group');
      })
      .finally(() => Promise.resolve());
  },
  updateProjectGroup(id, data) {
    return LfService.updateSegment(id, data)
      .then(() => {
        Message.success('Project Group updated successfully');
        this.listProjectGroups();
      })
      .catch(() => {
        Message.error('Something went wrong while updating the project group');
      })
      .finally(() => Promise.resolve());
  },
  searchProjectGroup(search) {
    this.searchProjectGroups = search;

    this.listProjectGroups();
  },
  // Projects
  listProjects(parentSlug) {
    if (parentSlug) {
      this.projects.parentSlug = parentSlug;
    }

    return LfService.queryProjects({
      limit: this.projects.pagination.pageSize,
      offset: this.offset,
      filter: {
        name: this.searchProjects,
        parentSlug: this.projects.parentSlug,
      },
    })
      .then((response) => {
        const count = Number(response.count);

        this.projects.list = response.rows;

        if (!this.searchProjects) {
          this.projects.pagination.total = count;
        }

        this.projects.pagination.count = count;
      })
      .catch(() => {
        Message.error('Something went wrong while fetching projects');
      })
      .finally(() => Promise.resolve());
  },
  findProject(id) {
    return LfService.findSegment(id)
      .then((project) => Promise.resolve(project))
      .catch(() => {
        Message.error('Something went wrong while getting the project');
        Promise.resolve();
      });
  },
  createProject(data) {
    return LfService.createProject(data)
      .then(() => {
        Message.success('Project created successfully');
      })
      .catch(() => {
        Message.error('Something went wrong while creating the project');
      })
      .finally(() => Promise.resolve());
  },
  updateProject(id, data) {
    return LfService.updateSegment(id, data)
      .then(() => {
        Message.success('Project updated successfully');
      })
      .catch(() => {
        Message.error('Something went wrong while updating the project');
      })
      .finally(() => Promise.resolve());
  },
  searchProject(search) {
    this.searchProjects = search;

    this.listProjects();
  },
  findSubProject(id) {
    return LfService.findSegment(id)
      .then((project) => Promise.resolve(project))
      .catch(() => {
        Message.error('Something went wrong while getting the sub-project');
        Promise.resolve();
      });
  },
  // Sub-projects
  createSubProject(data) {
    return LfService.createSubProject(data)
      .then(() => {
        Message.success('Sub-project created successfully');
      })
      .catch(() => {
        Message.error('Something went wrong while creating the sub-project');
      })
      .finally(() => Promise.resolve());
  },
  updateSubProject(id, data) {
    return LfService.updateSegment(id, data)
      .then(() => {
        Message.success('Sub-project updated successfully');
      })
      .catch(() => {
        Message.error('Something went wrong while updating the sub-project');
      })
      .finally(() => Promise.resolve());
  },
  // Pagination
  updatePageSize(pageSize) {
    this.projectGroups.pagination.pageSize = pageSize;

    this.listProjectGroups();
  },
};
