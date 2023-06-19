import { LfService } from '@/modules/lf/segments/lf-segments-service';
import Message from '@/shared/message/message';
import { router } from '@/router';

export default {
  // Project Groups
  listProjectGroups({ search = null, offset, limit } = {}) {
    this.projectGroups.loading = true;

    return LfService.queryProjectGroups({
      limit: limit !== undefined ? limit : this.projectGroups.pagination.pageSize,
      offset: offset !== undefined ? offset : this.offset,
      filter: {
        name: search,
      },
    })
      .then((response) => {
        const count = Number(response.count);

        this.projectGroups.list = response.rows;

        if (!search) {
          this.projectGroups.pagination.total = count;
        }

        this.projectGroups.pagination.count = count;
        return Promise.resolve();
      })
      .catch(() => {
        Message.error('Something went wrong while fetching project groups');
        return Promise.reject();
      })
      .finally(() => {
        this.projectGroups.loading = false;
      });
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
    this.listProjectGroups({ search });
  },
  // Projects
  listProjects({ parentSlug = null, search = null } = {}) {
    this.projects.loading = true;

    if (parentSlug) {
      this.projects.parentSlug = parentSlug;
    }

    LfService.queryProjects({
      limit: this.projects.pagination.pageSize,
      offset: this.offset,
      filter: {
        name: search,
        parentSlug: this.projects.parentSlug,
      },
    })
      .then((response) => {
        const count = Number(response.count);

        this.projects.list = response.rows;

        if (!search) {
          this.projects.pagination.total = count;
        }

        this.projects.pagination.count = count;
      })
      .catch(() => {
        Message.error('Something went wrong while fetching projects');
      })
      .finally(() => {
        this.projects.loading = false;
      });
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
        this.listProjects();
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
        this.listProjects();
      })
      .catch(() => {
        Message.error('Something went wrong while updating the project');
      })
      .finally(() => Promise.resolve());
  },
  searchProject(search) {
    this.listProjects({ search });
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
        this.listProjects();
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
        this.listProjects();
      })
      .catch(() => {
        Message.error('Something went wrong while updating the sub-project');
      })
      .finally(() => Promise.resolve());
  },
  // Pagination
  updateProjectGroupsPageSize(pageSize) {
    this.projectGroups.pagination.pageSize = pageSize;

    this.listProjectGroups();
  },
  updateProjectsPageSize(pageSize) {
    this.projects.pagination.pageSize = pageSize;

    this.listProjects();
  },
  updateSelectedProjectGroup(projectGroupId, sendToDashboard = true) {
    if (projectGroupId) {
      const projectGroup = this.projectGroups.list.find((p) => p.id === projectGroupId);

      this.selectedProjectGroup = projectGroup;

      if (sendToDashboard) {
        router.push({
          name: 'dashboard',
        });
      }
    } else {
      this.selectedProjectGroup = null;
    }
  },
};
