import { LfService } from '@/modules/lf/segments/lf-segments-service';

import { ToastStore } from '@/shared/message/notification';
import { router } from '@/router';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';
import { LfRole } from '@/shared/modules/permissions/types/Roles';

const isAdminOnly = () => {
  const authStore = useAuthStore();
  const { roles } = storeToRefs(authStore);

  return roles.value.includes(LfRole.projectAdmin);
};

export default {
  // Project Groups
  listProjectGroups({
    search = null, offset, limit, reset = false, adminOnly,
  } = {}) {
    if (reset) {
      this.projectGroups.pagination = {
        pageSize: 20,
        currentPage: 1,
        total: 0,
        count: 0,
      };
    }
    const offsetLoad = offset !== undefined ? offset : this.projectGroupOffset;
    const limitLoad = limit !== undefined ? limit : this.projectGroups.pagination.pageSize;
    this.projectGroups.loading = offsetLoad === 0;
    this.projectGroups.paginating = offsetLoad > 0;

    return LfService.queryProjectGroups({
      limit: limitLoad,
      offset: offsetLoad,
      filter: {
        name: search,
        adminOnly,
      },
    })
      .then((response) => {
        const count = Number(response.count);

        if (offsetLoad === 0 || reset) {
          this.projectGroups.list = response.rows;
        } else {
          this.projectGroups.list = [...this.projectGroups.list, ...response.rows];
        }

        if (!search) {
          this.projectGroups.pagination.total = count;
        }

        this.projectGroups.pagination.count = count;
        return Promise.resolve();
      })
      .catch(() => {
        ToastStore.error('Something went wrong while fetching project groups');
        return Promise.reject();
      })
      .finally(() => {
        this.projectGroups.paginating = false;
        this.projectGroups.loading = false;
      });
  },
  listAdminProjectGroups() {
    return LfService.queryProjectGroups({
      limit: null,
      offset: 0,
      filter: {
        adminOnly: true,
      },
    })
      .then((response) => {
        this.adminProjectGroups.list = response.rows;
        return Promise.resolve();
      })
      .catch(() => Promise.reject());
  },
  findProjectGroup(id) {
    return LfService.findSegment(id)
      .then((projectGroup) => Promise.resolve(projectGroup))
      .catch(() => {
        ToastStore.error('Something went wrong while getting the project group');
        Promise.resolve();
      });
  },
  createProjectGroup(data) {
    return LfService.createProjectGroup(data)
      .then(() => {
        ToastStore.success('Project Group created successfully');

        this.listProjectGroups({
          adminOnly: isAdminOnly(),
        });
      })
      .catch(() => {
        ToastStore.error('Something went wrong while creating the project group');
      })
      .finally(() => Promise.resolve());
  },
  updateProjectGroup(id, data) {
    return LfService.updateSegment(id, data)
      .then(() => {
        ToastStore.success('Project Group updated successfully');

        this.updateProjectGroupList(id, data);
      })
      .catch(() => {
        ToastStore.error('Something went wrong while updating the project group');
      })
      .finally(() => Promise.resolve());
  },
  updateProjectGroupList(id, data) {
    this.projectGroups.list = this.projectGroups.list.map((p) => {
      if (p.id === id) {
        return { ...p.value, ...data };
      }
      return p;
    });
    this.projectGroups.reload = true;
  },
  searchProjectGroup(search, limit, adminOnly, page) {
    this.projectGroups.pagination.currentPage = page !== undefined ? page : 1;
    this.listProjectGroups({
      search,
      limit,
      offset: page !== undefined ? undefined : 0,
      adminOnly: adminOnly !== undefined ? adminOnly : isAdminOnly(),
    });
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

    const offsetLoad = offset !== undefined ? offset : this.projectOffset;
    const limitLoad = limit !== undefined ? limit : this.projects.pagination.pageSize;
    this.projects.loading = offsetLoad === 0;
    this.projects.paginating = offsetLoad > 0;

    LfService.queryProjects({
      limit: limitLoad,
      offset: offsetLoad,
      filter: {
        name: search,
        parentSlug: this.projects.parentSlug,
      },
    })
      .then((response) => {
        const count = Number(response.count);

        if (offsetLoad === 0 || reset) {
          this.projects.list = response.rows;
        } else {
          this.projects.list = [...this.projects.list, ...response.rows];
        }

        if (!search) {
          this.projects.pagination.total = count;
        }

        this.projects.pagination.count = count;
      })
      .catch(() => {
        ToastStore.error('Something went wrong while fetching projects');
      })
      .finally(() => {
        this.projects.loading = false;
        this.projects.paginating = false;
      });
  },
  findProject(id) {
    return LfService.findSegment(id)
      .then((project) => Promise.resolve(project))
      .catch(() => {
        ToastStore.error('Something went wrong while getting the project');
        Promise.resolve();
      });
  },
  createProject(data) {
    return LfService.createProject(data)
      .then(() => {
        ToastStore.success('Project created successfully');
        this.listProjects();
      })
      .catch(() => {
        ToastStore.error('Something went wrong while creating the project');
      })
      .finally(() => Promise.resolve());
  },
  updateProject(id, data) {
    return LfService.updateSegment(id, data)
      .then(() => {
        ToastStore.success('Project updated successfully');
        this.updateProjectList(id, data);
      })
      .catch(() => {
        ToastStore.error('Something went wrong while updating the project');
      })
      .finally(() => Promise.resolve());
  },
  updateProjectList(id, data) {
    this.projects.list = this.projects.list.map((p) => {
      if (p.id === id) {
        return { ...p, ...data };
      }
      return p;
    });
  },
  searchProject(search, page = null) {
    this.projects.pagination.currentPage = page !== null ? page : 1;
    this.listProjects({ search, offset: page !== null ? undefined : 0 });
  },
  findSubProject(id) {
    return LfService.findSegment(id)
      .then((project) => Promise.resolve(project))
      .catch(() => {
        ToastStore.error('Something went wrong while getting the sub-project');
        Promise.resolve();
      });
  },
  // Sub-projects
  createSubProject(data) {
    return LfService.createSubProject(data)
      .then(() => {
        ToastStore.success('Sub-project created successfully');
        this.listProjects();
      })
      .catch(() => {
        ToastStore.error('Something went wrong while creating the sub-project');
      })
      .finally(() => Promise.resolve());
  },
  updateSubProject(id, data) {
    return LfService.updateSegment(id, data)
      .then(() => {
        ToastStore.success('Sub-project updated successfully');
        this.listProjects();
      })
      .catch(() => {
        ToastStore.error('Something went wrong while updating the sub-project');
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
