import { ProjectGroup, Project } from '@/modules/lf/segments/types/Segments';

export interface SegmentsState {
  selectedProjectGroup: ProjectGroup | null;
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
