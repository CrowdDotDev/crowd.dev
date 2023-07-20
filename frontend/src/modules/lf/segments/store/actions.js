import { LfService } from '@/modules/lf/segments/lf-segments-service';
import Message from '@/shared/message/message';
import { router } from '@/router';
import { getUserSegments } from '@/utils/segments';

export default {
  // Project Groups
  listProjectGroups({
    search = null, offset, limit, reset = false,
  } = {}) {
    this.projectGroups.loading = true;

    if (reset) {
      this.projectGroups.pagination = {
        pageSize: 20,
        currentPage: 1,
        total: 0,
        count: 0,
      };
    }

    return LfService.queryProjectGroups({
      limit: limit !== undefined ? limit : this.projectGroups.pagination.pageSize,
      offset: offset !== undefined ? offset : this.projectGroupOffset,
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
  listUserProjectGroups({
    search = null,
  } = {}) {
    this.userProjectGroups.loading = true;
    this.userProjectGroups.pagination = {
      total: 0,
      count: 0,
    };

    return LfService.queryProjectGroups({
      limit: null,
      offset: 0,
      filter: {
        name: search,
      },
    })
      .then((response) => {
        const count = Number(response.count);

        this.userProjectGroups.list = getUserSegments(response.rows);

        if (!search) {
          this.userProjectGroups.pagination.total = this.userProjectGroups.list.length;
        }

        this.userProjectGroups.pagination.count = this.userProjectGroups.list.length;
        return Promise.resolve();
      })
      .catch(() => {
        Message.error('Something went wrong while fetching project groups');
        return Promise.reject();
      })
      .finally(() => {
        this.userProjectGroups.loading = false;
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
  searchProjectGroup(search, limit) {
    this.projectGroups.pagination.currentPage = 1;
    this.listProjectGroups({ search, offset: 0, limit });
  },
  searchUserProjectGroup(search) {
    this.userProjectGroups.pagination.currentPage = 1;
    this.listUserProjectGroups({ search });
  },
  // Projects
  listProjects({
    parentSlug = null, search = null, offset, limit, reset = false,
  } = {}) {
    this.projects.loading = true;

    if (parentSlug) {
      this.projects.parentSlug = parentSlug;
    }

    if (reset) {
      this.projects.pagination = {
        pageSize: 20,
        currentPage: 1,
        total: 0,
        count: 0,
      };
    }

    LfService.queryProjects({
      limit: limit !== undefined ? limit : this.projects.pagination.pageSize,
      offset: offset !== undefined ? offset : this.projectOffset,
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
    this.projects.pagination.currentPage = 1;
    this.listProjects({ search, offset: 0 });
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
  doChangeProjectGroupCurrentPage(currentPage) {
    this.projectGroups.pagination.currentPage = currentPage;

    this.listProjectGroups();
  },
  doChangeProjectCurrentPage(currentPage) {
    this.projects.pagination.currentPage = currentPage;

    this.listProjects();
  },
};
