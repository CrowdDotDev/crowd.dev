import { ProjectGroup, Project } from '@/modules/lf/segments/types/Segments';

export interface SegmentsState {
  selectedProjectGroup: ProjectGroup | null;
  userProjectGroups: {
    list: ProjectGroup[],
    loading: boolean,
    pagination: {
      total: number,
      count: number,
    },
  },
  projectGroups: {
    list: ProjectGroup[],
    loading: boolean,
    pagination: {
      pageSize: number,
      currentPage: number,
      total: number,
      count: number,
    },
  },
  projects: {
    list: Project[],
    parentSlug: string,
    loading: boolean,
    pagination: {
      pageSize: number,
      currentPage: number,
      total: number,
      count: number,
    },
  }
}

const state: SegmentsState = {
  selectedProjectGroup: null,
  userProjectGroups: {
    list: [],
    loading: true,
    pagination: {
      total: 0,
      count: 0,
    },
  },
  projectGroups: {
    list: [],
    loading: true,
    pagination: {
      pageSize: 20,
      currentPage: 1,
      total: 0,
      count: 0,
    },
  },
  projects: {
    list: [],
    parentSlug: '',
    loading: true,
    pagination: {
      pageSize: 20,
      currentPage: 1,
      total: 0,
      count: 0,
    },
  },
};

export default () => state;
